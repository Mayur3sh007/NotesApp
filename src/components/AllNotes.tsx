import React, { useEffect, useState } from 'react';
import { useUser } from '@/providers/UserContext';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import NotesCard from './NotesCard';
import { useNotes } from '@/providers/NotesContext';

type Note = {
  id: string;
  Title: string;
  Content: string;
  ImageURL: string | null;
  CreatedAt: string;
  scheduleTime: string;
  completed: boolean;
};

const AllNotes: React.FC = () => {
  const { uid } = useUser();
  const { notes, isPinChanged } = useNotes();
  const [Notes, setNotes] = useState<Note[]>([]);

  const fetchNotes = async () => {
    if (!uid) {
      console.error('User is not logged in');
      return;
    }

    try {
      const notesCollection = collection(db, 'Notes');
      const q = query(notesCollection, where('userID', '==', uid));
      const querySnapshot = await getDocs(q);
      const fetchedNotes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Error fetching Notes: ', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    console.log("AllNotes");
  }, [uid, notes]);

  const editNote = async (id: string, title: string, content: string, image: string | null) => {
    try {
      const noteRef = doc(db, 'Notes', id);
      await updateDoc(noteRef, {
        Title: title,
        Content: content,
        ImageURL: image,
      });
      fetchNotes();
    } catch (error) {
      console.error('Error editing note: ', error);
    }
  };
  
  const deleteNote = async (id: string) => {
    try {
      const noteRef = doc(db, 'Notes', id);
      await deleteDoc(noteRef);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note: ', error);
    }
  };

  const pinNote = async (id: string) => {
    try {
      const pinnedNotes = JSON.parse(localStorage.getItem('PinnedNotesId') || '[]');
      pinnedNotes.push(id);
      localStorage.setItem('PinnedNotesId', JSON.stringify(pinnedNotes));
      fetchNotes();
      isPinChanged();
    } catch (error) {
      console.error('Error pinning note: ', error);
    }
  };
  
  const unpinNote = async (id: string) => {
    try {
      const pinnedNotes = JSON.parse(localStorage.getItem('PinnedNotesId') || '[]');
      pinnedNotes.splice(pinnedNotes.indexOf(id), 1);
      localStorage.setItem('PinnedNotesId', JSON.stringify(pinnedNotes));
      fetchNotes();
    } catch (error) {
      console.error('Error unpinning note: ', error);
    }
  };

  const isPinned = (id: string) => {
    const pinnedNotes = JSON.parse(localStorage.getItem('PinnedNotesId') || '[]');
    return pinnedNotes.includes(id);
  };

  const setReminder = async (id: string, time: string) => {
    try {
      const noteRef = doc(db, 'Notes', id);
      await updateDoc(noteRef, {
        reminderTime: time,
      });
      fetchNotes();
      scheduleNotification(id, time);
    } catch (error) {
      console.error('Error setting reminder: ', error);
    }
  };

  const scheduleNotification = (id: string, time: string) => {
    const now = new Date().getTime();
    const reminderTime = new Date(time).getTime();
    const timeUntilReminder = reminderTime - now;

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        showNotification(id);
      }, timeUntilReminder);
    }
  };

  const showNotification = (id: string) => {
    const note = Notes.find(note => note.id === id);
    if (note && Notification.permission === "granted") {
      new Notification(note.Title, { body: note.Content });
    }
  };

  const handleCompleteTask = async (id: string) => {
    try {
      const noteRef = doc(db, 'Notes', id);
      await updateDoc(noteRef, {
        completed: true,
      });
      fetchNotes();
    } catch (error) {
      console.error('Error completing task: ', error);
    }
  };

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Filtering Data
  const pendingNotes = Notes.filter(note => note.completed === false);
  const notesWithScheduleTimeTodayWithImages = pendingNotes.filter(note => (note.ImageURL !== null && (new Date(note.scheduleTime).getDate() === new Date().getDate())));
  const notesWithScheduleTimeTodayWithoutImages = pendingNotes.filter(note => (note.ImageURL === null && (new Date(note.scheduleTime).getDate() === new Date().getDate())));
  const notesWithImages = pendingNotes.filter(note => (note.ImageURL !== null && !(notesWithScheduleTimeTodayWithImages.includes(note))));
  const notesWithOutImages = pendingNotes.filter(note => (note.ImageURL === null && !(notesWithScheduleTimeTodayWithoutImages.includes(note))));
  const sortedNotesWithImages = notesWithImages.sort((a, b) => new Date(a.scheduleTime).getTime() - new Date(b.scheduleTime).getTime());
  const sortedNotesWithOutImages = notesWithOutImages.sort((a, b) => new Date(a.scheduleTime).getTime() - new Date(b.scheduleTime).getTime());

  if (Notes.length > 0) {
    return (
      <>
        {(notesWithScheduleTimeTodayWithImages.length > 0 || notesWithScheduleTimeTodayWithoutImages.length > 0) && (
          <>
            <h1 className="text-center text-2xl font-bold mt-4">Today's Tasks</h1>
            <NotesCard notes={notesWithScheduleTimeTodayWithImages} withImage={true} deleteNote={deleteNote} editNote={editNote} pinNote={pinNote} unpinNote={unpinNote} isPinned={isPinned} setReminder={setReminder} handleCompleteTask={handleCompleteTask} />
            <NotesCard notes={notesWithScheduleTimeTodayWithoutImages} withImage={false} deleteNote={deleteNote} editNote={editNote} pinNote={pinNote} unpinNote={unpinNote} isPinned={isPinned} setReminder={setReminder} handleCompleteTask={handleCompleteTask} />
          </>
        )}
        {sortedNotesWithOutImages.length > 0 || sortedNotesWithImages.length > 0 && (
          <>
            <h1 className="text-center text-2xl font-bold mt-4">Upcoming Tasks</h1>
            <NotesCard notes={sortedNotesWithOutImages} withImage={false} deleteNote={deleteNote} editNote={editNote} pinNote={pinNote} unpinNote={unpinNote} isPinned={isPinned} setReminder={setReminder} handleCompleteTask={handleCompleteTask} />
            <NotesCard notes={sortedNotesWithImages} withImage={true} deleteNote={deleteNote} editNote={editNote} pinNote={pinNote} unpinNote={unpinNote} isPinned={isPinned} setReminder={setReminder} handleCompleteTask={handleCompleteTask} />
          </>
        )};
      </>
    );
  }

};

export default AllNotes;
