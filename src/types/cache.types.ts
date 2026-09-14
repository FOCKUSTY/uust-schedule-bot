export type SerializedCache<T> = {
  value: T;
  expiresAt?: string;
};
