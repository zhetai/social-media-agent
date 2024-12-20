/**
 * Twitter authentication server implementation using Passport.js
 * Provides endpoints for Twitter OAuth authentication and user session management
 */
import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as TwitterStrategy } from "passport-twitter";
import session from "express-session";
import dotenv from "dotenv";

dotenv.config();

/** Twitter user profile with authentication details */
interface TwitterUser {
  id: string;
  username: string;
  displayName: string;
  photos?: { value: string }[];
  _json: {
    id_str: string;
    screen_name: string;
    name: string;
    profile_image_url_https?: string;
  };
}

/**
 * Handles Twitter OAuth authentication flow and session management
 */
export class TwitterAuthServer {
  private app: express.Application;
  private port: number;

  /**
   * Initializes the Twitter authentication server with a specified port
   * @param port The port number to run the server on (default: 3000)
   */
  constructor(port = 3000) {
    this.app = express();
    this.port = port;
    this.configureMiddleware();
    this.configurePassport();
    this.setupRoutes();
  }

  /**
   * Configures Express middleware for session handling and Passport initialization
   */
  private configureMiddleware(): void {
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-session-secret",
        resave: true,
        saveUninitialized: true,
        cookie: {
          secure: false,
          maxAge: 60000,
        },
      }),
    );
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  /**
   * Sets up Passport.js serialization and strategy configuration
   */
  private configurePassport(): void {
    this.configureTwitterStrategy();

    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser<TwitterUser>((user, done) => {
      done(null, user);
    });
  }

  /**
   * Configures Twitter OAuth strategy with API credentials
   * @throws {Error} If Twitter API credentials are not found in environment variables
   */
  private configureTwitterStrategy(): void {
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET) {
      throw new Error("Twitter API credentials are not configured");
    }

    passport.use(
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_API_KEY,
          consumerSecret: process.env.TWITTER_API_KEY_SECRET,
          callbackURL: `http://localhost:${this.port}/callback`,
        },
        (
          token: string,
          tokenSecret: string,
          profile: TwitterUser,
          done: (error: any, user?: any) => void,
        ) => {
          const user = {
            ...profile,
            token,
            tokenSecret,
          };
          console.log("\n✅ TWITTER USER AUTHENTICATED ✅\n");
          console.dir(user, { depth: null });
          return done(null, user);
        },
      ),
    );
  }

  /**
   * Sets up authentication and callback routes for Twitter OAuth flow
   */
  private setupRoutes(): void {
    this.app.get("/", (_req: Request, res: Response) => {
      res.send('<a href="/auth/twitter">Login with Twitter</a>');
    });

    // Twitter routes
    this.app.get("/auth/twitter", passport.authenticate("twitter"));
    this.app.get("/callback", (req: Request, res: Response) => {
      passport.authenticate("twitter", {
        failureRedirect: "/login",
      })(req, res, (err: any) => {
        if (err) {
          console.error("Authentication error:", err);
          return res.redirect("/");
        }
        res.redirect("/");
      });
    });

    this.app.get(
      "/profile",
      this.ensureAuthenticated,
      (req: Request, res: Response) => {
        res.json(req.user);
      },
    );
  }

  /**
   * Middleware to check if user is authenticated
   * Redirects to home page if not authenticated
   */
  private ensureAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }

  /**
   * Starts the authentication server on the configured port
   */
  public start(): void {
    this.app.listen(this.port, () => {
      console.log(
        `Social authentication server is running on port ${this.port}`,
      );
    });
  }
}

// Entry point when running the server directly
async function main() {
  const server = new TwitterAuthServer();
  server.start();
}

// Only run the server if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
