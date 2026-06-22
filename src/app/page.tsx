import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Happy Dark Hour</h1>
        <p className="text-xl text-gray-600 mb-12">Escape Game Competitivo per Pub/Bar</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            href="/operator"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 px-8 rounded-lg transition-colors"
          >
            <div className="text-lg">🎮 Operatore</div>
            <div className="text-sm mt-2 opacity-90">Gestione partita</div>
          </Link>
          
          <Link 
            href="/play"
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-6 px-8 rounded-lg transition-colors"
          >
            <div className="text-lg">📱 Gioca</div>
            <div className="text-sm mt-2 opacity-90">Area giocatori</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
