import { useEffect } from "react";
import { useRouter } from 'next/router';
import { routeDefault } from "../helper/routeDefault";

const Home = () => {
  const router = useRouter();
  useEffect(() => {
    routeDefault(router)
  }, [router]);
}

export default Home;
