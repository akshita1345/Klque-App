import { apiClient } from "@/client/client";
import { useEffect, useState } from "react";

const useApi = (url: string, options?: any) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient(url, options);
      setData(response);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (url) fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
};
export default useApi;