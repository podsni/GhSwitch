export type SshConfig = {
  keyPath: string;
  hostAlias?: string; // default: github-<accountName>
};

export type TokenConfig = {
  username: string;
  token: string;
};

export type Account = {
  name: string; // short label
  gitUserName?: string;
  gitEmail?: string;
  ssh?: SshConfig;
  token?: TokenConfig;
};

export type AppConfig = {
  accounts: Account[];
};

