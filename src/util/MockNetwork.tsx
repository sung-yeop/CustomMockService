import { useMemo } from "react";
import { CustomMockService } from "./CustomMockService";

export default function MockNetwork() {
  const history = useMemo(() => {
    return CustomMockService.getHistory();
  }, []);
  return (
    <div>
      {history.map((h, i) => (
        <div key={i}>{h.url}</div>
      ))}
    </div>
  );
}
