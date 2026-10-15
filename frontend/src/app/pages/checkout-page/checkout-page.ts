import { Component, computed, DestroyRef, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import SummarizeOrder from "../../components/summarize-order/summarize-order";
import { CartService } from "../../core/services/cart.service";
import { CurrencyPipe } from "@angular/common";
import { handleImageError } from "../../core/utils";
import { BackButton } from "../../components/back-button/back-button";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormField, MatLabel } from "@angular/material/select";
import { MatAnchor } from "@angular/material/button";
import { MatInput } from "@angular/material/input";
import { MatRadioGroup, MatRadioButton } from "@angular/material/radio";
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
    MatIcon,
    MatProgressSpinner,
    RouterLink,
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
        <div
          role="alert"
          data-testid="checkout-error"
          class="border border-red-200 rounded-xl my-4 p-6 bg-red-100 text-red-700 font-medium"
        >
          <h2 class="text-lg font-semibold text-red-800 mb-3">{{ error.message }}</h2>
          @if (error.errors.length) {
            <ul class="space-y-2 list-disc list-inside">
              @for (err of error.errors; track $index) {
                <li>{{ err }}</li>
              }
            </ul>
          }
          <button
            matButton="outlined"
            type="button"
            class="mt-4"
            [disabled]="isSubmitting()"
            (click)="retry()"
          >
            <mat-icon>refresh</mat-icon>
            <span i18n="@@checkoutPage.retry">Riprova</span>
          </button>
        </div>
      }

      @if (!cart()) {
        <p role="status" class="text-gray-600" i18n="@@checkoutPage.loadingCart">Caricamento del carrello...</p>
      } @else if (cartEmpty()) {
        <div appViewPanel role="status" data-testid="checkout-empty-cart" class="flex flex-col items-start gap-4">
          <p class="text-lg text-gray-700" i18n="@@checkoutPage.emptyCart">
            Il tuo carrello è vuoto: non c'è nulla da ordinare.
          </p>
          <a matButton="filled" routerLink="/products" i18n="@@checkoutPage.emptyCart.explore">Esplora i prodotti</a>
        </div>
      } @else {
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
                      <img src="assets/amex.svg" alt="American Express" class="h-6" />
                      <img src="assets/poste_pay.svg" alt="PostePay" class="h-6" />
                    </div>
                  </mat-radio-button>

                  <mat-radio-button value="apple_pay">
                    <img src="assets/apple_pay.svg" alt="Apple Pay" class="h-8" />
                  </mat-radio-button>

                  <mat-radio-button value="pay_pal">
                    <img src="assets/pay_pal.svg" alt="PayPal" class="h-8" />
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
                data-testid="checkout-submit"
                [disabled]="checkoutForm.invalid || isSubmitting()"
                [attr.aria-busy]="isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="inline-flex items-center gap-2">
                    <mat-progress-spinner mode="indeterminate" diameter="18" aria-hidden="true" />
                    {{ invioInCorso }}
                  </span>
                } @else {
                  {{ invioOrdine }}
                }
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
              @for (item of cart()?.items; track item.id) {
                <div class="mb-2 pb-2">
                  <div class="flex gap-2 items-center space-between">
                    <img
                      [src]="item.product.image_url"
                      alt=""
                      class="w-16 h-16 object-cover rounded"
                      (error)="handleImageError($event)"
                    />
                    <div>
                      <p class="font-medium">{{ item.product.name }}</p>
                      <p class="text-gray-500 italic">
                        {{ item.quantity }} x
                        {{ item.discounted_unit_price | currency: "EUR" }}
                      </p>
                    </div>
                  </div>
                </div>
              }
            </ng-container>
          </app-summarize-order>
        </div>
      </div>
      }
    </div>
  `,
  styles: ``,
})
export default class CheckoutPage implements OnInit {
  private ordersService = inject(OrdersService);
  private cartService = inject(CartService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  cart = this.cartService.cart;
  cartEmpty = this.cartService.isEmpty;

  error = this.ordersService.checkoutError;
  isSubmitting = computed(() => this.ordersService.checkoutStatus() === "submitting");

  readonly handleImageError = handleImageError;

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
      // Demo: nessun pagamento reale. Il backend richiede comunque stripe_payment_token (obbligatorio),
      // quindi alla scelta del metodo viene generato un token fittizio, come farebbe Stripe Elements.
      stripe_payment_token: [null as string | null, Validators.required],
    }),
  });

  ngOnInit(): void {
    // Ogni ingresso nella pagina parte da uno stato pulito e dal carrello aggiornato dal server
    this.ordersService.resetCheckout();
    this.cartService.loadCart();

    this.checkoutForm
      .get("payment.payment_method")!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => {
        if (method) {
          const fakeToken = `tok_demo_${method}_${Math.random().toString(36).substring(2, 10)}`;
          this.checkoutForm.get("payment.stripe_payment_token")?.setValue(fakeToken, { emitEvent: false });
        }
      });
  }

  onSubmit() {
    if (this.checkoutForm.invalid || this.isSubmitting()) return;
    this.ordersService.checkout(this.checkoutForm.getRawValue() as OrderData);
  }

  /** Rimanda la stessa richiesta: i dati del form restano quelli inseriti. */
  retry() {
    this.ordersService.retryCheckout();
  }
}
