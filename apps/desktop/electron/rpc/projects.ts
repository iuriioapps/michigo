import { createProject, listProjects } from "../projects";
import { os } from "./base";

export const projects = {
  list: os.projects.list.handler(() => listProjects()),
  create: os.projects.create.handler(({ input }) => createProject(input)),
};
