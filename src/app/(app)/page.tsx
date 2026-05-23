import SpacePage from "./spaces/[id]/page";

export default function HomePage() {
  return <SpacePage params={Promise.resolve({ id: "esp-produto" })} />;
}
