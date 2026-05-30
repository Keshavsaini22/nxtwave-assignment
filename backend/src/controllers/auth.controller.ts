import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  /**
   * Register a new user account
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role, organizationName, organizationId } = req.body;
      const user = await AuthService.register({
        email,
        password,
        role,
        organizationName,
        organizationId,
      });

      res.status(201).json({
        status: 201,
        message: 'User registered successfully',
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user and create session tokens
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const payload = await AuthService.login({ email, password });

      res.status(200).json({
        status: 200,
        message: 'Authentication successful',
        data: payload,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rotate access sessions using refresh token
   */
  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const payload = await AuthService.refreshSession(refreshToken);

      res.status(200).json({
        status: 200,
        message: 'Access session renewed successfully',
        data: payload,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Terminate user session and revoke refresh keys
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);

      res.status(200).json({
        status: 200,
        message: 'Logged out successfully. Session invalidated.',
      });
    } catch (error) {
      next(error);
    }
  }
}
