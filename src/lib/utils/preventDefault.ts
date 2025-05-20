export default function preventDefault(fn: (e: Event) => void) {
  return (e) => {
    e.preventDefault();
    fn(e);
  };
}
