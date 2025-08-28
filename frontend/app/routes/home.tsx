import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { useEffect } from "react";
import { useAuthStore } from "~/stores/auth";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
    const { isAuthenticated, user } = useAuthStore()
    const navigate=useNavigate()
    const getDefaultRoute = () => {
    if (!isAuthenticated || !user) return '/login'
    
    switch (user.role) {
      case 'waiter':
        return '/waiter'
      case 'chef':
        return '/chef'
      case 'admin':
        return '/admin'
      default:
        return '/login'
    }
  }
  useEffect(()=>{ 
    let path=getDefaultRoute()
    navigate(path)
  },[isAuthenticated,user,getDefaultRoute,navigate])
}
