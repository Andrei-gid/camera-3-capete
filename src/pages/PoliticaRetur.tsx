import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PoliticaRetur = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back Navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Înapoi la magazin</span>
        </Link>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          Politica de Retur
        </h1>

        {/* Content */}
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
          <p className="text-lg mb-6">
            Conform legislației Republicii Moldova privind protecția consumatorilor (Legea nr. 105/2003), consumatorul are dreptul de a returna produsele în termen de 14 zile calendaristice de la primirea lor.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            1. Condiții Obligatorii pentru Retur
          </h2>
          <p className="mb-4">
            Pentru ca returul să fie acceptat, produsul trebuie să îndeplinească următoarele condiții cumulative:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Să fie returnat în ambalajul original intact, nedeteriorat, fără urme de scotch sau etichete lipite direct pe cutia produsului.</li>
            <li>Să conțină toate accesoriile și documentele originale.</li>
            <li>Să nu prezinte urme de utilizare, zgârieturi, lovituri sau șocuri mecanice.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            2. Procedura de Retur
          </h2>
          <p className="mb-6">
            Înainte de a expedia produsul, clientul este OBLIGAT să ne contacteze (telefonic sau prin email) pentru a anunța intenția de retur și a primi instrucțiunile de expediere. Retururile neanunțate pot fi refuzate.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            3. Costurile de Transport
          </h2>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Dacă produsul prezintă un defect de fabricație, costul transportului este suportat de Noi.</li>
            <li>În cazul răzgândirii (renunțarea la cumpărare): Costul transportului de retur este suportat integral de Cumpărător.</li>
            <li><strong>ATENȚIE:</strong> Dacă ați beneficiat de Transport Gratuit la livrarea inițială, costul returului rămâne în sarcina dumneavoastră.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            4. Restituirea Banilor
          </h2>
          <p>
            Suma va fi restituită în contul bancar specificat de client în termen de maxim 14 zile de la recepționarea și verificarea produsului returnat.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoliticaRetur;
