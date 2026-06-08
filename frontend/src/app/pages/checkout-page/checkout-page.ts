import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import SummarizeOrder from "../../components/summarize-order/summarize-order";
import { CartService } from "../../core/services/cart.service";
import { CurrencyPipe } from "@angular/common";
import { computeDiscountPrice, handleImageError } from "../../core/utils";
import { BackButton } from "../../components/back-button/back-button";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormField, MatLabel } from "@angular/material/select";
import { MatAnchor } from "@angular/material/button";
import { LoadingService } from "../../core/http/services/loading.service";
import { MatInput } from "@angular/material/input";
import { MatRadioGroup, MatRadioButton } from "@angular/material/radio";
import { Subject, takeUntil } from "rxjs";
import { OrderData, OrdersService } from "../../core/services/orders.service";

@Component({
  selector: "app-checkout-page",
  imports: [
    SummarizeOrder,
    CurrencyPipe,
    BackButton,
    ViewPanel,
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatAnchor,
    MatInput,
    MatRadioGroup,
    MatRadioButton,
  ],
  template: `
    <div class="mx-auto max-w-[1200px] py-6">
      <app-back-button [navigateTo]="['/cart']" class="mb-4">
        <ng-container i18n="@@checkoutPage.tornaAlCarrello">Rivedi carrello</ng-container>
      </app-back-button>

      <h1 i18n="@@checkoutPage.completaOrdine" class="text-3xl font-extrabold mb-4">
        Completa il tuo ordine
      </h1>

      @if (error(); as error) {
        <div class="border border-red-200 rounded-xl my-4 p-6 bg-red-100 text-red-600 font-medium">
          <h4 class="text-lg font-semibold text-red-700 mb-3">{{ error.message }}</h4>
          <div class="space-y-2">
            @for (err of error.errors; track $index) {
              <p class="ml-2">{{ err }}</p>
            }
          </div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <!-- CAMPI DI FATTURAZIONE E SPEDIZIONE -->
          <form [formGroup]="checkoutForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Fatturazione / Spedizione -->
            <section appViewPanel formGroupName="order">
              <h2 i18n="@@checkoutPage.spedizione.title" class="text-2xl font-medium mb-4">
                Indirizzo di spedizione
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Nome e Cognome -->
                <mat-form-field>
                  <mat-label i18n="@@checkoutPage.spedizione.nome">Nome</mat-label>
                  <input matInput type="text" formControlName="first_name" placeholder="Nome" />
                </mat-form-field>
                <mat-form-field>
                  <mat-label i18n="@@checkoutPage.spedizione.cognome">Cognome</mat-label>
                  <input matInput type="text" formControlName="last_name" placeholder="Cognome" />
                </mat-form-field>

                <!-- Via e numero civico -->
                <div class="col-span-2">
                  <mat-form-field>
                    <mat-label i18n="@@checkoutPage.spedizione.via">Via e numero civico</mat-label>
                    <input
                      matInput
                      type="text"
                      formControlName="street"
                      placeholder="Via e numero civico"
                    />
                  </mat-form-field>
                </div>

                <!-- Città e CAP -->
                <mat-form-field>
                  <mat-label i18n="@@checkoutPage.spedizione.citta">Città</mat-label>
                  <input matInput type="text" formControlName="city" placeholder="Città" />
                </mat-form-field>
                <mat-form-field>
                  <mat-label i18n="@@checkoutPage.spedizione.cap">CAP</mat-label>
                  <input matInput type="text" formControlName="zip_code" placeholder="CAP" />
                </mat-form-field>

                <!-- Paese -->
                <mat-form-field>
                  <mat-label i18n="@@checkoutPage.spedizione.paese">Paese</mat-label>
                  <input matInput type="text" formControlName="country" placeholder="Paese" />
                </mat-form-field>
              </div>
            </section>

            <!-- Pagamento -->
            <section appViewPanel formGroupName="payment">
              <h2 i18n="@@checkoutPage.pagamento.title" class="text-2xl font-medium mb-4">
                Dettagli di pagamento
              </h2>

              <!-- Per semplicità, non implementiamo direttamente i campi di pagamento ma ci affidiamo a Stripe Elements o simili -->
              <p i18n="@@checkoutPage.pagamento.description" class="text-gray-500 italic">
                Per semplicità, in questa demo non gestiamo direttamente i dettagli di pagamento. In
                un'app reale, qui integreremmo Stripe Elements o simili per raccogliere in modo
                sicuro le informazioni di pagamento e ottenere un token da inviare al backend.
              </p>

              <div>
                <mat-radio-group formControlName="payment_method" class="flex flex-col gap-4">
                  <mat-radio-button value="card">
                    <div class="flex gap-2 items-center">
                      <span i18n="@@checkoutPage.pagamento.card" class="font-medium">Carta di debito/credito</span>
                      <img src="assets/mastercard.svg" alt="Mastercard" class="h-6" />
                      <img src="assets/visa.svg" alt="Visa" class="h-6" />
                      <img src="assets/amex.svg" alt="America Express" class="h-6" />
                      <img src="assets/poste_pay.svg" alt="Post Pay" class="h-6" />
                    </div>
                  </mat-radio-button>

                  <mat-radio-button value="apple_pay">
                    <img src="assets/apple_pay.svg" alt="Apple Pay" class="h-8" />
                  </mat-radio-button>

                  <mat-radio-button value="pay_pal">
                    <img src="assets/pay_pal.svg" alt="Pay Pal" class="h-8" />
                  </mat-radio-button>

                  <mat-radio-button value="stripe">
                    <img src="assets/stripe.svg" alt="Stripe" class="h-8" />
                  </mat-radio-button>
                </mat-radio-group>
              </div>
            </section>

            <!-- Submit -->
            <div appViewPanel class="mt-4">
              @if (checkoutForm.valid) {
                <p i18n="@@checkoutPage.submit.description" class="text-gray-500 my-3">Tutto pronto! Invia subito il tuo ordine!</p>
              }
              <button
                type="submit"
                matButton="filled"
                class="w-full"
                [disabled]="checkoutForm.invalid || isLoading()"
              >
                {{ isLoading() ? invioInCorso : invioOrdine }}
              </button>
            </div>
          </form>
        </div>

        <!-- RIEPILOGO DELL'ORDINE -->
        <div>
          <app-summarize-order>
            <ng-container title>
              <h4 i18n="@@checkoutPage.riepilogo.title" class="text-lg font-semibold">Riepilogo ordine</h4>
            </ng-container>

            <ng-container checkoutItems>
              @for (item of cart()?.items; track item.product.id) {
                <div class="mb-2 pb-2">
                  <div class="flex gap-2 items-center space-between">
                    <img
                      [src]="item.product.image_url"
                      [alt]="'Immagine di ' + item.product.name"
                      class="w-16 h-16 object-cover rounded"
                      (error)="handleImageError($event)"
                    />
                    <div>
                      <p class="font-medium">{{ item.product.name }}</p>
                      <p class="text-gray-500 italic">
                        {{ item.quantity }} x
                        {{
                          computeDiscountPrice(item.unit_price, item.product.discount_percentage)
                            | currency: "EUR"
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              }
            </ng-container>
          </app-summarize-order>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export default class CheckoutPage implements OnInit {
  private ordersService = inject(OrdersService);
  private cartService = inject(CartService);
  private loadingService = inject(LoadingService);
  private readonly fb = inject(FormBuilder);
  private destroyRef = new Subject<void>();

  cart = this.cartService.cart;

  isLoading = this.loadingService.isLoading;
  error = this.ordersService.error;

  readonly handleImageError = handleImageError;
  readonly computeDiscountPrice = computeDiscountPrice;

  invioOrdine = $localize`:@@checkoutPage.submit.default:Conferma ordine`;
  invioInCorso = $localize`:@@checkoutPage.submit.inProgress:Invio dell'ordine...`;

  readonly checkoutForm = this.fb.group({
    order: this.fb.group({
      first_name: ["", Validators.required],
      last_name: ["", Validators.required],
      street: ["", Validators.required],
      zip_code: ["", [Validators.required, Validators.pattern(/^\d{5}$/)]],
      city: ["", Validators.required],
      country: ["", Validators.required],
    }),
    payment: this.fb.group({
      payment_method: ["", Validators.required],
      stripe_payment_token: [null as string | null, Validators.required],
    }),
  });

  ngOnInit(): void {
    this.checkoutForm
      .get("payment.payment_method")!
      .valueChanges.pipe(takeUntil(this.destroyRef))
      .subscribe((method) => {
        if (method) {
          const fakeToken = `tok_${Math.random().toString().substring(2, 10)}`;
          this.checkoutForm
            .get("payment.stripe_payment_token")
            ?.setValue(fakeToken, { emitEvent: false });
        }
      });
  }

  onSubmit() {
    if (this.checkoutForm.invalid) return;
    this.ordersService.checkout(this.checkoutForm.value as OrderData);
  }
}

