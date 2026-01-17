export const getPartTypeStyle = (partType?: string) => {
  const styles: Record<string, string> = {
    exhaust: "part-type-exhaust",
    seat: "part-type-seat",
    frame: "part-type-frame",
    "full-bike": "part-type-full-bike",
  };
  return styles[partType || ""] || "part-type-default";
};
