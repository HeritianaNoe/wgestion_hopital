import { ServiceForm } from "./service-form";

export default function NewServicePage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Nouveau service</h1>
      <p className="mb-6 text-sm text-slate-500">
        Les chambres standard sont rattachées à un service. Vous pourrez l&apos;associer lors de la création d&apos;une chambre.
      </p>
      <ServiceForm />
    </div>
  );
}
