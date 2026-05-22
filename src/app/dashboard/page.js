'use client'
import { useAuth } from "@/hooks/useAuth";
import Nav from "../components/Nav/Nav";

export default function dashboard(){

    useAuth()

    return(

        <>

        <Nav tela="dashboard"/>

        </>

    );
}