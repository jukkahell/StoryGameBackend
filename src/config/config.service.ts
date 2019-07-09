import * as dotenv from "dotenv";
import * as fs from "fs";
import * as Joi from "joi";
import { LoggerTransport } from "nest-logger";

export interface EnvConfig {
  [key: string]: string;
}

export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  get dbHost(): string {
    return this.envConfig.DB_HOST;
  }
  get dbPort(): number {
    return Number(this.envConfig.DB_PORT);
  }
  get dbDatabase(): string {
    return this.envConfig.DB_DATABASE;
  }
  get dbUser(): string {
    return this.envConfig.DB_USER;
  }
  get dbPass(): string {
    return process.env.NODE_ENV !== "development" ? process.env.DB_PASSWORD : this.envConfig.DB_PASS;
  }

  get appPort(): string {
    return this.envConfig.APP_PORT;
  }

  get logLevel(): string {
    return this.envConfig.LOG_LEVEL;
  }
  get logFilePath(): string {
    return this.envConfig.LOG_FILE_PATH;
  }
  get logAppenders(): LoggerTransport[] {
    return this.envConfig.LOG_APPENDERS.split(",").map((t: any) => (t as LoggerTransport));
  }
  get serviceName(): string {
    return this.envConfig.SERVICE_NAME;
  }

  get jwtExpires(): string {
    return this.envConfig.JWT_EXPIRES;
  }
  get jwtSecret(): string {
    if (process.env.NODE_ENV !== "development") {
      return process.env.JWT_SECRET;
    } else {
      return this.envConfig.JWT_SECRET;
    }
  }

  get alphaVantageApiKey(): string {
    return process.env.ALPHA_VANTAGE_API_KEY;
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid(["development", "production", "test"])
        .default("development"),
      DB_HOST: Joi.string().required(),
      DB_PORT: Joi.number().required(),
      DB_DATABASE: Joi.string().required(),
      DB_USER: Joi.string().required(),
      DB_PASS: Joi.string().required(),
      APP_PORT: Joi.number().required(),
      LOG_APPENDERS: Joi.required(),
      LOG_FILE_PATH: Joi.string().when("LOG_APPENDERS", {
        is: Joi.string()
          .regex(/.*rotate.*/)
          .required(),
        then: Joi.required(),
      }),
      LOG_LEVEL: Joi.string()
        .valid(["debug", "info", "warn", "error"])
        .required(),
      SERVICE_NAME: Joi.string().required(),
      JWT_EXPIRES: Joi.string().required(),
      JWT_SECRET: Joi.string(),
    });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }
}
