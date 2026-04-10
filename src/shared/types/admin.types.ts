export interface CreateAdminRequest {
  username: string;
  password: string;
}

export interface AdminResponse {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}
