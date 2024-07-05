"use client";
import { useEffect, useState } from "react";
import { auth } from "@/config/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { cn } from "@/utils/cn";

export default function Home() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push("/sign-up");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    try {
      await signOut(auth);
      router.push("/sign-up");
    } catch (error : any) {
      console.error("Logout Error:", error.message);
    }
  };

  // useEffect(() => {
  //   const checkUser = async () => {
  //     try {
  //       const currentUser = auth.currentUser;
  //       if (currentUser) {
  //         setUser(currentUser);
  //         setUserLoggedIn(true);
  //       } else {
  //         setUser(null);
  //         setUserLoggedIn(false);
  //         router.push("/sign-up");
  //       }
  //     } catch (error : any) {
  //       console.error("Authentication Error:", error.message);
  //     }
  //   };

  //   checkUser();
  // }, []);

  return (
    <div className="flex flex-col items-end justify-center h-[50px] w-screen mr-auto">
        <>
          {/* Display user information */}
          
          <button onClick={logout}>Logout</button>
        </>
    </div>
  );
}
