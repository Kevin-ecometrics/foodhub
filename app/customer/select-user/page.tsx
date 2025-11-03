import { Suspense } from "react";
import SelectUser from "../components/SelectUser";

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando Usuario...</div>}>
      <SelectUser />
    </Suspense>
  );
}
