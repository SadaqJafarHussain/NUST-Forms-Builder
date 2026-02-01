import Image from "next/image";
import Peer from "@/images/logo.jpg";

export const Testimonial = async () => {
  return (
    <div className="flex items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-300 p-12">
      <Image src={Peer} alt="Logo" className="h-auto w-full max-w-md" />
    </div>
  );
};
