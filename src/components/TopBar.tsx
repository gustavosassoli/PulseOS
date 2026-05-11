import { auth, logout } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

export default function TopBar() {
  const [user] = useAuthState(auth);

  const getFirstName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0];
    }
    return 'Curador';
  };

  return (
    <header className="bg-[#131313] flex justify-between items-center px-6 py-4 w-full sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary-container/20">
          <img 
            alt="Perfil do Usuário" 
            className="w-full h-full object-cover" 
            src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuDegf1Z8KKAXK7YnelFyYDTZqL0h7VfoiT8hbkNODnBy5B9mYSuhf3OazYwDsCEKuKjW3EM2qjxO51vXJM5LPbgWjRnSps16HLdqlzicryXFfFML1IWO7vtdSBWMOgC1ZpZrLQqccDqo2N-Wu-clz9EvZNJRn9MBxQZikJqPq0w5HwWl-l1vEOnn-_E_ff26mZRhdLvTZ3r7HetGKb9lDpggsoTz06R5sCxqQ7ll1lVBkeLr9JigHSGXRhbaMlegU6AwnZYzyTXOc4"}
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="font-['Inter'] font-bold tracking-tight text-xl text-white">
          Bom Dia, {getFirstName()}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={logout}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-high text-outline hover:text-error transition-colors active:scale-95 duration-200"
          title="Sair"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#2A2A2A] transition-colors text-on-surface-variant active:scale-95 duration-200">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  );
}
