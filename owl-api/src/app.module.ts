import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { MailModule } from "./mail/mail.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { ProjectsModule } from "./projects/projects.module";
import { RolesGuard } from "./guards/roles.guard";

//todo: dynamically enable & disable modules based on env. this will allow separate modules to run as separate services
@Module({
  imports: [MailModule, UserModule, AuthModule, ProjectsModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
