export type GithubTokenResponseInterface = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

export type GithubUserResponseInterface = {
  login: string;
  name: string | null;
};

export type GithubEmailResponseInterface = {
  email: string;
  primary: boolean;
  verified: boolean;
};