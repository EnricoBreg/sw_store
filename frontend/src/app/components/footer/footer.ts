import { Component } from "@angular/core";

@Component({
  selector: "app-footer",
  imports: [],
  template: `
    <div class="-mt-1 border-t border-gray-700 text-gray-700 bg-gray-100 py-20 px-3">
      <div class="max-w-[1200px] mx-auto grid md:grid-cols-3 items-start">
        <!-- Contatti -->
        <div>
          <h4 class="text-xl font-bold">SW Store</h4>
          <span class="text-sm text-gray-400">Copyright 2026</span>
          <div class="mt-2 flex flex-col gap-4">
            <p class="text-lg font-semibold">Contatti</p>
            <ul class="space-y-1">
              <li>Sede legale: Via del Commercio, 55, 45100, Rovigo, Italy</li>
              <li>Partita IVA: 1234567890</li>
              <li>Codice Fiscale: 1234567890</li>
              <li>Capitale sociale: 10.000€</li>
            </ul>

            <ul class="space-y-1">
              <li>Email: assistenza@swstore.com</li>
              <li>PEC: amministrazione@swstore.pec.com</li>
              <li>Telefono: 00393338087889</li>
            </ul>
          </div>
        </div>

        <!-- Informazioni  -->
        <div>
          <div class="mt-8 flex flex-col gap-4">
            <p class="text-lg font-semibold">Domande frequenti</p>
            <ul class="space-y-1">
              <li><a class="hover:underline cursor-pointer" href="#">Come effettuare un ordine</a></li>
              <li><a class="hover:underline cursor-pointer" href="#">Tempi di spedizione</a></li>
              <li><a class="hover:underline cursor-pointer" href="#">Come effettuare un reso</a></li>
              <li><a class="hover:underline cursor-pointer" href="#">Certificazioni dei prodotti</a></li>
              <li><a class="hover:underline cursor-pointer" href="#">Metodi di pagamento</a></li>
              <li><a class="hover:underline cursor-pointer" href="#">Dove si trova il mio ordine</a></li>
              <li><a class="hover:underline cursor-pointer" href="#">Come modifico i dati del mio account</a></li>
              <li><a class="hover:underline cursor-pointer" href="#">Iscriviti alla nostra newsletter</a></li>
            </ul>
          </div>
        </div>

        <div>
          <!-- Spedito da  -->
          <div class="mb-4 mt-8">
            <p class="text-lg font-semibold">Spedito da</p>
            <div class="flex gap-3">
              <img class="w-12 h-12 cursor-pointer" src="assets/dhl_express.svg" alt="DHL espress" />
              <img class="w-12 h-12 cursor-pointer" src="assets/sda.svg" alt="DHL espress" />
              <img class="w-12 h-12 cursor-pointer" src="assets/poste_italiane.svg" alt="DHL espress" />
            </div>
          </div>

          <!-- Metodi di pagamento -->
          <div>
            <p class="text-lg font-semibold">Metodi di pagamento</p>
            <div class="flex flex-wrap gap-x-3">
              <img class="w-12 h-12" src="assets/mastercard.svg" alt="Mastercard" />
              <img class="w-12 h-12" src="assets/visa.svg" alt="Visa" />
              <img class="w-12 h-12" src="assets/amex.svg" alt="American Express" />
              <img class="w-12 h-12" src="assets/nexi.svg" alt="Nexi" />
              <img class="w-12 h-12" src="assets/poste_pay.svg" alt="Postpay" />
              <img class="w-12 h-12" src="assets/pay_pal.svg" alt="PayPal" />
              <img class="w-12 h-12" src="assets/apple_pay.svg" alt="Apple Pay" />
              <img class="w-12 h-12" src="assets/stripe.svg" alt="Stripe" />
            </div>
          </div>
        </div>
      </div>
      <!-- Social -->
      <div class="max-w-[1200px] mx-auto my-8 py-6 border-t border-gray-700 space-y-4">
        <div class="flex flex-wrap justify-around">
          <a href="#" class="hover:underline cursor-pointer">CVG</a>
          <a href="#" class="hover:underline cursor-pointer">Informazioni legali</a>
          <a href="#" class="hover:underline cursor-pointer">Informativa sulla privacy</a>
          <a href="#" class="hover:underline cursor-pointer">Diritto di recesso</a>
          <a href="#" class="hover:underline cursor-pointer">Impostazioni dati</a>
        </div>

        <div>
          <p class="text-lg font-semibold mb-2">Seguici su</p>
          <div class="flex gap-3">
            <a class="cursor-pointer" href="#"><img class="w-8 h-8" src="assets/instagram.svg" alt="Instagram" /></a>
            <a class="cursor-pointer" href="#"><img class="w-8 h-8" src="assets/tiktok.svg" alt="Tiktok" /></a>
            <a class="cursor-pointer" href="#"><img class="w-8 h-8" src="assets/facebook.svg" alt="Facebook" /></a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export default class Footer {}
