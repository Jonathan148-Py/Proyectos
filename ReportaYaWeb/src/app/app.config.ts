import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { firebaseConfig } from './firebase.config';

import { appInitializer } from './app-init';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),

    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      multi: true
    },

    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
