import { FC } from "react";
import SideBar from "../components/Home/SideBar";

const Home: FC = () => {
  return (
    <div className="flex">
      <SideBar />

      <div className="hidden grow flex-col items-center justify-center gap-3 md:flex!">
        <h1 className="text-center">
          Select or create a conversation to start chatting
        </h1>
      </div>
    </div>
  );
};

export default Home;
