import { ScreenSkeleton } from "@/components/ui/ScreenSkeleton";

export default function LoginLoading() {
  return <ScreenSkeleton accent="violet" cards={1} title="Cargando la entrada al torneo." />;
}
