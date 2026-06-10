declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: number;
        email: string;
        role: 'ADMIN' | 'LEADER';
      };
    }
  }
}

export {};
