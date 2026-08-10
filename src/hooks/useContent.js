import { useEffect, useState } from "react";
import { loadContent, loadWorksContent } from "../content";

function useContentLoader(loader) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", data: null, error: null });

    loader(controller.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ status: "error", data: null, error });
        }
      });

    return () => controller.abort();
  }, [attempt, loader]);

  return {
    ...state,
    retry: () => setAttempt((value) => value + 1),
  };
}

export function useContent() {
  return useContentLoader(loadContent);
}

export function useWorksContent() {
  return useContentLoader(loadWorksContent);
}
