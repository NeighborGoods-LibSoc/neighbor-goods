declare module "uuid" {
  export function v4(): string;
  export function validate(id: string): boolean;
}
