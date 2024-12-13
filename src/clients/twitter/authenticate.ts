import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import session from 'express-session';
import dotenv from 'dotenv';

dotenv.config();

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

declare global {
  namespace Express {
    interface User extends TwitterUser {}
  }
}

export class TwitterAuthServer {
  private app: express.Application;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.configureMiddleware();
    this.configurePassport();
    this.setupRoutes();
  }

  private configureMiddleware(): void {
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || 'your-session-secret',
        resave: false,
        saveUninitialized: false,
      })
    );
    this.app.use(passport.initialize());
    this.app.use(passport.session());
  }

  private configurePassport(): void {
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET) {
      throw new Error('Twitter API credentials are not configured');
    }

    passport.use(
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_API_KEY,
          consumerSecret: process.env.TWITTER_API_KEY_SECRET,
          callbackURL: `http://localhost:${this.port}/callback`,
        },
        (token: string, tokenSecret: string, profile: TwitterUser, done: any) => {
          // Store the tokens with the user profile
          const user = {
            ...profile,
            token,
            tokenSecret,
          };
          console.log("\n✅ USER AUTHENTICATED ✅\n");
          console.dir(user, { depth: null });
          return done(null, user);
        }
      )
    );

    passport.serializeUser((user, done) => {
      done(null, user);
    });

    passport.deserializeUser<Express.User>((user, done) => {
      done(null, user);
    });
  }

  private setupRoutes(): void {
    this.app.get('/', (_req: Request, res: Response) => {
      res.send('<a href="/auth/twitter">Login with Twitter</a>');
    });

    this.app.get('/auth/twitter', passport.authenticate('twitter'));

    this.app.get(
      '/callback',
      passport.authenticate('twitter', {
        failureRedirect: '/login',
      }),
      (_req: Request, res: Response) => {
        res.redirect('/');
      }
    );

    this.app.get('/profile', this.ensureAuthenticated, (req: Request, res: Response) => {
      res.json(req.user);
    });
  }

  private ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Twitter authentication server is running on port ${this.port}`);
    });
  }
}

// Export the server class
async function main() {
  const server = new TwitterAuthServer();
  server.start();
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default TwitterAuthServer;