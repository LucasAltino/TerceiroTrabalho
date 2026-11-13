import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, LoginDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() credentials: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(credentials);
  }
}
