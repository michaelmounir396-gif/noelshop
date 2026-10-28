import { AlertCircle, Home } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);
  return <main className="dashboard-state dashboard-state--blocked"><AlertCircle size={50} /><h1>الصفحة غير موجودة</h1><p>الرابط الذي فتحته غير متاح.</p><button className="primary-cta" onClick={() => setLocation("/")}><Home size={16} /> الرجوع للموقع</button></main>;
}
