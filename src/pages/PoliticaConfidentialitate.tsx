import { Link } from "react-router-dom";
import { useContent } from "@/hooks/useContent";
import { formatPhone } from "@/data/siteContent";
import { ArrowLeft } from "lucide-react";

const PoliticaConfidentialitate = () => {
  const { contact } = useContent();
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
          Politica de Confidențialitate
        </h1>

        {/* Content */}
        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
          <p className="text-lg mb-6">
            <em>Ultima actualizare: 12 August 2026</em>
          </p>

          <p className="mb-6">
            Această Politică de Confidențialitate descrie modul în care colectăm, utilizăm, stocăm și protejăm datele dumneavoastră cu caracter personal atunci când vizitați și efectuați achiziții pe site-ul nostru, în conformitate cu Legea nr. 133/2011 privind protecția datelor cu caracter personal a Republicii Moldova.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            1. Operatorul de date cu caracter personal
          </h2>
          <p className="mb-4">
            Operatorul datelor dumneavoastră cu caracter personal este societatea comercială ce administrează acest magazin online.
          </p>
          <p className="mb-4">
            Pentru orice întrebări, solicitări sau exercitarea drepturilor privind protecția datelor, ne puteți contacta la:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Denumire firmă: {contact.company}</li>
            <li>IDNO: {contact.cui}</li>
                        <li>Email: {contact.email}</li>
            <li>Telefon: {formatPhone(contact.phone)}</li>
            <li>Adresă sediu social: {contact.address || "—"}</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            2. Ce date cu caracter personal colectăm?
          </h2>
          <p className="mb-4">
            Colectăm doar datele strict necesare pentru procesarea și livrarea comenzilor dumneavoastră:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Date de identificare: Nume și prenume.</li>
            <li>Date de contact: Adresă de email, număr de telefon.</li>
            <li>Date de livrare și facturare: Adresa completă de livrare, adresa de facturare, datele bancare (în cazul plăților online sau rambursărilor).</li>
            <li>Date tehnice: Adresa IP, tipul de browser, modulele cookie.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            3. Scopul și temeiul juridic al prelucrării
          </h2>
          <p className="mb-4">
            Prelucrăm datele dumneavoastră în următoarele scopuri:
          </p>
          <ol className="list-decimal pl-6 space-y-2 mb-6">
            <li><strong>Executarea contractului:</strong> Preluarea, confirmarea, facturarea, expedierea și livrarea produselor comandate (inclusiv livrarea cu opțiunea de verificare a coletului și plată ramburs).</li>
            <li><strong>Îndeplinirea obligațiilor legale:</strong> Întocmirea documentelor financiar-contabile și păstrarea acestora conform legilor fiscale ale Republicii Moldova.</li>
            <li><strong>Interes legitim:</strong> Prevenirea fraudei și securitatea site-ului.</li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            4. Cât timp păstrăm datele dumneavoastră?
          </h2>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Datele aferente comenzilor și facturilor: Păstrate conform legislației financiar-contabile a Republicii Moldova.</li>
            <li>Datele contului sau formularelor de comandă: Păstrate doar pe perioada necesară procesării comenzii sau până la solicitarea expresă de ștergere.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            5. Transmiterea datelor către terți
          </h2>
          <p className="mb-4">
            Pentru finalizarea și livrarea comenzilor, datele dumneavoastră pot fi transmise partenerilor noștri de încredere (împuterniciți):
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Companii de curierat: Pentru livrarea coletelor la adresa indicată (ex: FAN Courier, Cargus, Sameday, DPD).</li>
            <li>Furnizori de servicii IT și hosting: Pentru funcționarea în siguranță a platformei.</li>
            <li>Autorități publice: Doar în cazul unei obligații legale sau la solicitarea organelor abilitate din Republica Moldova.</li>
          </ul>
          <p className="font-medium text-gray-900 mb-6">
            Nu vindem, nu închiriem și nu transferăm datele dumneavoastră cu caracter personal către terți în scopuri de marketing fără acordul dumneavoastră explicit.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">
            6. Drepturile dumneavoastră conform Legii nr. 133/2011
          </h2>
          <p className="mb-4">
            În calitate de persoană vizată, aveți următoarele drepturi legale:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li><strong>Dreptul de acces:</strong> Puteți solicita o confirmare a datelor prelucrate și o copie a acestora.</li>
            <li><strong>Dreptul la rectificare:</strong> Puteți solicita corectarea datelor inexacte sau incomplete.</li>
            <li><strong>Dreptul la ștergere („dreptul de a fi uitat”):</strong> Puteți cere ștergerea datelor în condițiile prevăzute de lege.</li>
            <li><strong>Dreptul la restricționarea prelucrării:</strong> Puteți solicita limitarea utilizării datelor în anumite situații.</li>
            <li><strong>Dreptul de a depune o plângere:</strong> Aveți dreptul de a depune o plângere la Centrul Național pentru Protecția Datelor cu Caracter Personal (<strong>CNPDCP</strong>):
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Website: www.datepersonale.md</li>
                <li>Adresă: mun. Chișinău, Republica Moldova.</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PoliticaConfidentialitate;
