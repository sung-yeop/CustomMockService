import { CustomMockServer } from "./util/MockServer";

const data = {
  isSuccess: false,
  data: {
    a: [1, 2, 2, 3, 4, 5, 6],
    b: {
      k: "qwer",
      d: "qewra",
    },
  },
};

CustomMockServer.get({ endpoint: "/api/v1", returnData: data });

console.log(CustomMockServer.print());
