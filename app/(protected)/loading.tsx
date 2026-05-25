import { ScreenSkeleton } from "@/components/ui/ScreenSkeleton";

export default function ProtectedLoading() {
  return <ScreenSkeleton cards={4} title="Cargando tu vista privada del torneo." />;
}
