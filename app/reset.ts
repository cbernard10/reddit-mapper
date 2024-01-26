import axios from "axios";

const reset = async () => {
  await axios.delete("http://localhost:3001/api/reset");
};

reset();