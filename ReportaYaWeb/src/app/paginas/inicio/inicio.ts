import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css'],
  standalone: true,
  imports: [RouterModule] // necesario para routerLink en el botón
})
export class Inicio { }



