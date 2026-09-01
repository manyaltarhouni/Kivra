/* =========================================================
   KIVRA STORE
   DATABASE VERSION
   ========================================================= */

/*
  مهم:
  المنتجات ليست هنا.

  الموقع يقرأ المنتجات من Supabase.
  بعد إعداد Supabase مرة واحدة:
  إضافة كفر جديد لا تحتاج تعديل هذا الملف.
*/


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL = "https://dwqsyyikqyedbvscearv.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_uQk-bxeERNR9X-QLoVPqSQ_rdBIp5Cv";


/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

const supabaseScript = document.createElement("script");

supabaseScript.src =
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

supabaseScript.onload = initStore;

document.head.appendChild(supabaseScript);


/* =========================================================
   STORE SETTINGS
   ========================================================= */

const STORE = {
  name: "Kivra Store",
  phone: "0916872045",
  whatsapp: "218916872045"
};


/* =========================================================
   VARIABLES
   ========================================================= */

let supabase = null;

let products = [];

let cart = JSON.parse(
  localStorage.getItem("kivra_cart") || "[]"
);

let selectedProduct = null;
let selectedPhone = null;
let selectedColor = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const $ = selector =>
  document.querySelector(selector);

const grid =
  $("#productsGrid");


/* =========================================================
   INIT
   ========================================================= */

async function initStore() {

  if (
    SUPABASE_URL.includes("ضع_") ||
    SUPABASE_ANON_KEY.includes("ضع_")
  ) {

    showDatabaseError(
      "لم يتم ربط قاعدة المنتجات بعد."
    );

    return;
  }


  supabase =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );


  await loadProducts();

  setupRealtime();

}


/* =========================================================
   DATABASE ERROR
   ========================================================= */

function showDatabaseError(message) {

  grid.innerHTML = `
    <div
      class="empty"
      style="grid-column:1/-1"
    >
      ${message}
    </div>
  `;

}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  const {
    data,
    error
  } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "KIVRA products error:",
      error
    );

    showDatabaseError(
      "تعذر تحميل الكفرات حاليًا."
    );

    return;
  }


  products = data || [];

  renderProducts();

}


/* =========================================================
   REALTIME
   ========================================================= */

function setupRealtime() {

  supabase
    .channel("kivra-products")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products"
      },
      async () => {

        /*
          عند إضافة أو تعديل أو حذف كفر
          يتم تحديث المنتجات تلقائيًا.
        */

        await loadProducts();

      }
    )
    .subscribe();

}


/* =========================================================
   PRODUCT COLORS
   ========================================================= */

function getColorStyle(color) {

  const colors = {

    "وردي": "#e36bcf",
    "بنفسجي": "#7650b5",
    "أزرق": "#3e6ed8",
    "أسود": "#17171b",
    "رمادي": "#8a8a91",
    "أبيض": "#f5f5f5",
    "أخضر": "#4f9d69",
    "أحمر": "#d94b4b",
    "أصفر": "#d9b93f",
    "برتقالي": "#df8148"

  };

  return colors[color] || "#777";

}


/* =========================================================
   RENDER PRODUCTS
   ========================================================= */

function renderProducts() {

  if (!grid) {
    return;
  }


  const phone =
    $("#phoneFilter").value;


  const search =
    $("#productSearch").value
      .trim()
      .toLowerCase();


  const filteredProducts =
    products.filter(product => {

      const phones =
        Array.isArray(product.phones)
          ? product.phones
          : [];


      const phoneMatch =
        phone === "all" ||
        phones.includes(phone);


      const name =
        String(product.name || "")
          .toLowerCase();


      const collection =
        String(product.collection || "")
          .toLowerCase();


      const searchMatch =
        name.includes(search) ||
        collection.includes(search);


      return phoneMatch && searchMatch;

    });


  if (!filteredProducts.length) {

    grid.innerHTML = `
      <div
        class="empty"
        style="grid-column:1/-1"
      >
        لا توجد كفرات متوفرة لهذا الاختيار.
      </div>
    `;

    return;

  }


  grid.innerHTML =
    filteredProducts
      .map(product => {

        const colors =
          Array.isArray(product.colors)
            ? product.colors
            : [];


        const colorDots =
          colors
            .map(color => `
              <span
                class="color-dot"
                title="${escapeHTML(color)}"
                style="
                  background:${getColorStyle(color)}
                "
              ></span>
            `)
            .join("");


        const image =
          product.image_url;


        return `

          <article
            class="product-card"
            onclick="openProduct('${product.id}')"
          >

            <div
              class="product-image art-${escapeHTML(
                product.theme || "black"
              )}"
            >

              ${
                image
                  ? `
                    <img
                      src="${escapeHTML(image)}"
                      alt="${escapeHTML(product.name)}"
                      loading="lazy"
                      style="
                        width:100%;
                        height:100%;
                        object-fit:contain;
                      "
                    >
                  `
                  : `
                    <div class="mock-case">
                      K
                    </div>
                  `
              }

            </div>


            <div class="product-info">

              <h3>
                ${escapeHTML(product.name)}
              </h3>


              <p>
                ${escapeHTML(
                  product.collection || ""
                )}
                /
                ${colors.length}
                ألوان
              </p>


              <div class="color-preview">
                ${colorDots}
              </div>


              <span class="price">
                ${Number(product.price || 0)}
                د.ل
              </span>

            </div>

          </article>

        `;

      })
      .join("");

}


/* =========================================================
   OPEN PRODUCT
   ========================================================= */

function openProduct(id) {

  selectedProduct =
    products.find(
      product =>
        String(product.id) === String(id)
    );


  if (!selectedProduct) {
    return;
  }


  const phones =
    Array.isArray(selectedProduct.phones)
      ? selectedProduct.phones
      : [];


  const colors =
    Array.isArray(selectedProduct.colors)
      ? selectedProduct.colors
      : [];


  selectedPhone =
    phones[0] || null;


  selectedColor =
    colors[0] || null;


  renderModal();


  $("#productModal")
    .classList
    .add("open");


  $("#overlay")
    .classList
    .add("open");


  document.body.classList.add(
    "modal-open"
  );

}


/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function renderModal() {

  if (!selectedProduct) {
    return;
  }


  const product =
    selectedProduct;


  const phones =
    Array.isArray(product.phones)
      ? product.phones
      : [];


  const colors =
    Array.isArray(product.colors)
      ? product.colors
      : [];


  const image =
    product.image_url;


  $("#modalContent").innerHTML = `

    <div class="modal-product">

      <div
        class="modal-art art-${
          escapeHTML(product.theme || "black")
        }"
      >

        ${
          image
            ? `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name)}"
                style="
                  width:100%;
                  height:100%;
                  object-fit:contain;
                "
              >
            `
            : `
              <div class="mock-case">
                ${
                  escapeHTML(
                    String(product.name || "K")
                      .charAt(0)
                  )
                }
              </div>
            `
        }

      </div>


      <div class="modal-details">

        <span class="mini-title">
          ${escapeHTML(product.collection || "")}
        </span>


        <h2>
          ${escapeHTML(product.name)}
        </h2>


        <span class="price">
          ${Number(product.price || 0)}
          د.ل
        </span>


        <div class="option-title">
          اختر موديل iPhone
        </div>


        <div class="options">

          ${
            phones.length
              ? phones.map(phone => `

                  <button
                    class="option ${
                      phone === selectedPhone
                        ? "selected"
                        : ""
                    }"
                    onclick="selectPhone(${JSON.stringify(phone)})"
                  >
                    ${escapeHTML(phone)}
                  </button>

                `).join("")
              : `
                <span class="empty">
                  لا توجد موديلات محددة.
                </span>
              `
          }

        </div>


        <div class="option-title">
          اختر اللون
        </div>


        <div class="options">

          ${
            colors.length
              ? colors.map(color => `

                  <button
                    class="option ${
                      color === selectedColor
                        ? "selected"
                        : ""
                    }"
                    onclick="selectColor(${JSON.stringify(color)})"
                  >
                    ${escapeHTML(color)}
                  </button>

                `).join("")
              : `
                <span class="empty">
                  لا توجد ألوان محددة.
                </span>
              `
          }

        </div>


        <button
          class="primary-btn add-btn"
          onclick="addToCart()"
        >

          أضف إلى السلة

          <span>
            ←
          </span>

        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   SELECT PHONE
   ========================================================= */

function selectPhone(phone) {

  selectedPhone = phone;

  renderModal();

}


/* =========================================================
   SELECT COLOR
   ========================================================= */

function selectColor(color) {

  selectedColor = color;

  renderModal();

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart() {

  if (
    !selectedProduct ||
    !selectedPhone ||
    !selectedColor
  ) {

    alert(
      "يرجى اختيار موديل الهاتف واللون."
    );

    return;

  }


  const existingItem =
    cart.find(item =>

      String(item.productId) ===
        String(selectedProduct.id) &&

      item.phone === selectedPhone &&

      item.color === selectedColor

    );


  if (existingItem) {

    existingItem.quantity =
      (existingItem.quantity || 1) + 1;

  } else {

    cart.push({

      id: Date.now(),

      productId:
        selectedProduct.id,

      name:
        selectedProduct.name,

      phone:
        selectedPhone,

      color:
        selectedColor,

      price:
        Number(selectedProduct.price || 0),

      quantity: 1

    });

  }


  saveCart();

  closeModal();

  openCart();

}


/* =========================================================
   SAVE CART
   ========================================================= */

function saveCart() {

  localStorage.setItem(
    "kivra_cart",
    JSON.stringify(cart)
  );


  renderCart();

  updateCartCount();

}


/* =========================================================
   CART COUNT
   ========================================================= */

function updateCartCount() {

  const count =
    cart.reduce(
      (total, item) =>
        total +
        (item.quantity || 1),
      0
    );


  $("#cartCount")
    .textContent = count;

}


/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {

  const cartItems =
    $("#cartItems");


  if (!cart.length) {

    cartItems.innerHTML = `
      <div class="empty">
        السلة فارغة
      </div>
    `;

    $("#cartTotal")
      .textContent = "0 د.ل";

    return;

  }


  cartItems.innerHTML =
    cart.map(
      (item, index) => {

        const quantity =
          item.quantity || 1;


        return `

          <div class="cart-row">

            <div class="cart-thumb"></div>


            <div class="cart-row-content">

              <h4>
                ${escapeHTML(item.name)}
              </h4>


              <p>
                ${escapeHTML(item.phone)}
                ·
                ${escapeHTML(item.color)}
              </p>


              <strong>
                ${
                  Number(item.price || 0) *
                  quantity
                }
                د.ل
              </strong>


              <div class="quantity-controls">

                <button
                  class="option"
                  onclick="decreaseQuantity(${index})"
                >
                  −
                </button>

                <span>
                  ${quantity}
                </span>

                <button
                  class="option"
                  onclick="increaseQuantity(${index})"
                >
                  +
                </button>

              </div>

            </div>


            <button
              class="icon-btn cart-delete"
              onclick="removeCart(${index})"
              aria-label="حذف"
            >
              ×
            </button>

          </div>

        `;

      }
    ).join("");


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        (item.quantity || 1),
      0
    );


  $("#cartTotal")
    .textContent =
      `${total} د.ل`;

}


/* =========================================================
   INCREASE
   ========================================================= */

function increaseQuantity(index) {

  cart[index].quantity =
    (cart[index].quantity || 1) + 1;

  saveCart();

}


/* =========================================================
   DECREASE
   ========================================================= */

function decreaseQuantity(index) {

  const quantity =
    cart[index].quantity || 1;


  if (quantity > 1) {

    cart[index].quantity =
      quantity - 1;

  } else {

    cart.splice(index, 1);

  }


  saveCart();

}


/* =========================================================
   REMOVE
   ========================================================= */

function removeCart(index) {

  cart.splice(index, 1);

  saveCart();

}


/* =========================================================
   OPEN CART
   ========================================================= */

function openCart() {

  $("#cartDrawer")
    .classList
    .add("open");


  $("#overlay")
    .classList
    .add("open");

}


/* =========================================================
   CLOSE EVERYTHING
   ========================================================= */

function closeAll() {

  $("#cartDrawer")
    .classList
    .remove("open");


  $("#productModal")
    .classList
    .remove("open");


  $("#checkoutModal")
    .classList
    .remove("open");


  $("#overlay")
    .classList
    .remove("open");


  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   CLOSE PRODUCT MODAL
   ========================================================= */

function closeModal() {

  $("#productModal")
    .classList
    .remove("open");


  $("#overlay")
    .classList
    .remove("open");


  document.body.classList.remove(
    "modal-open"
  );

}


/* =========================================================
   SEARCH
   ========================================================= */

$("#searchBtn")
  .addEventListener(
    "click",
    () => {

      document
        .querySelector("#products")
        .scrollIntoView({
          behavior: "smooth"
        });


      setTimeout(() => {

        $("#productSearch")
          .focus();

      }, 500);

    }
  );


/* =========================================================
   FILTER
   ========================================================= */

$("#phoneFilter")
  .addEventListener(
    "change",
    renderProducts
  );


$("#productSearch")
  .addEventListener(
    "input",
    renderProducts
  );


/* =========================================================
   CART BUTTON
   ========================================================= */

$("#cartBtn")
  .addEventListener(
    "click",
    openCart
  );


/* =========================================================
   CLOSE CART
   ========================================================= */

$("#closeCart")
  .addEventListener(
    "click",
    closeAll
  );


/* =========================================================
   CLOSE PRODUCT
   ========================================================= */

$("#closeModal")
  .addEventListener(
    "click",
    closeModal
  );


/* =========================================================
   OVERLAY
   ========================================================= */

$("#overlay")
  .addEventListener(
    "click",
    closeAll
  );


/* =========================================================
   MOBILE MENU
   ========================================================= */

$("#menuBtn")
  .addEventListener(
    "click",
    () => {

      $("#menuBtn")
        .classList
        .toggle("active");


      $("#mainNav")
        .classList
        .toggle("mobile-open");

    }
  );


/* =========================================================
   CLOSE MOBILE MENU
   ========================================================= */

document
  .querySelectorAll(".nav a")
  .forEach(link => {

    link.addEventListener(
      "click",
      () => {

        $("#mainNav")
          .classList
          .remove("mobile-open");

      }
    );

  });


/* =========================================================
   CHECKOUT
   ========================================================= */

$("#checkoutBtn")
  .addEventListener(
    "click",
    openCheckout
  );


function openCheckout() {

  if (!cart.length) {

    alert("السلة فارغة.");

    return;

  }


  renderCheckoutSummary();


  $("#checkoutModal")
    .classList
    .add("open");


  $("#overlay")
    .classList
    .add("open");


  document.body.classList.add(
    "modal-open"
  );

}


/* =========================================================
   CHECKOUT SUMMARY
   ========================================================= */

function renderCheckoutSummary() {

  const summary =
    $("#checkoutSummary");


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        (item.quantity || 1),
      0
    );


  summary.innerHTML = `

    <div class="checkout-summary-title">
      ملخص الطلب
    </div>

    ${cart.map(item => `

      <div class="checkout-summary-row">

        <span>
          ${escapeHTML(item.name)}
          —
          ${escapeHTML(item.phone)}
          —
          ${escapeHTML(item.color)}
          × ${item.quantity || 1}
        </span>

        <strong>
          ${
            Number(item.price || 0) *
            (item.quantity || 1)
          }
          د.ل
        </strong>

      </div>

    `).join("")}


    <div class="checkout-total">

      <span>
        الإجمالي
      </span>

      <strong>
        ${total} د.ل
      </strong>

    </div>

  `;

}


/* =========================================================
   CLOSE CHECKOUT
   ========================================================= */

$("#closeCheckout")
  .addEventListener(
    "click",
    closeAll
  );


/* =========================================================
   SUBMIT ORDER
   ========================================================= */

$("#checkoutForm")
  .addEventListener(
    "submit",
    function(event) {

      event.preventDefault();


      if (!cart.length) {

        alert("السلة فارغة.");

        return;

      }


      const name =
        $("#customerName")
          .value
          .trim();


      const phone =
        $("#customerPhone")
          .value
          .trim();


      const address =
        $("#customerAddress")
          .value
          .trim();


      const notes =
        $("#customerNotes")
          .value
          .trim();


      if (
        !name ||
        !phone ||
        !address
      ) {

        alert(
          "يرجى إدخال جميع البيانات المطلوبة."
        );

        return;

      }


      const total =
        cart.reduce(
          (sum, item) =>
            sum +
            Number(item.price || 0) *
            (item.quantity || 1),
          0
        );


      let message =

`🛍️ طلب جديد من KIVRA Store

👤 اسم الزبون:
${name}

📱 رقم الهاتف:
${phone}

📍 العنوان / المنطقة:
${address}

━━━━━━━━━━━━━━

📦 تفاصيل الطلب:
`;


      cart.forEach(
        (item, index) => {

          message += `

${index + 1}. ${item.name}
• الهاتف: ${item.phone}
• اللون: ${item.color}
• الكمية: ${item.quantity || 1}
• السعر: ${
  Number(item.price || 0) *
  (item.quantity || 1)
} د.ل
`;

        }
      );


      message += `

━━━━━━━━━━━━━━

💰 الإجمالي:
${total} د.ل
`;


      if (notes) {

        message += `

📝 ملاحظات:
${notes}
`;

      }


      message += `

شكراً لاختياركم KIVRA Store.`;


      const whatsappURL =
        `https://wa.me/${STORE.whatsapp}?text=${
          encodeURIComponent(message)
        }`;


      localStorage.setItem(
        "kivra_last_order",
        JSON.stringify({
          name,
          phone,
          address,
          notes,
          cart,
          total,
          createdAt:
            new Date().toISOString()
        })
      );


      window.open(
        whatsappURL,
        "_blank"
      );


      cart = [];

      saveCart();


      $("#checkoutForm")
        .reset();


      closeAll();


      showToast(
        "تم تجهيز الطلب وفتح WhatsApp"
      );

    }
  );


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  const toast =
    $("#successToast");


  toast.textContent =
    message;


  toast.classList.add("show");


  setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);

}


/* =========================================================
   ACTIVE NAV
   ========================================================= */

const sections =
  document.querySelectorAll(
    "main section[id]"
  );


window.addEventListener(
  "scroll",
  () => {

    let current = "home";


    sections.forEach(section => {

      const sectionTop =
        section.offsetTop - 120;


      if (
        window.scrollY >= sectionTop
      ) {

        current =
          section.id;

      }

    });


    document
      .querySelectorAll(".nav a")
      .forEach(link => {

        link.classList.remove(
          "active"
        );


        if (
          link.getAttribute("href") ===
          `#${current}`
        ) {

          link.classList.add(
            "active"
          );

        }

      });

  }
);


/* =========================================================
   ESCAPE
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (event.key === "Escape") {

      closeAll();

    }

  }
);


/* =========================================================
   SECURITY HELPER
   ========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   INITIAL CART
   ========================================================= */

renderCart();

updateCartCount();                                          
/* =========================================================
   KIVRA ADMIN - ADD PRODUCTS
   ========================================================= */

const adminPanel = document.querySelector("#adminPanel");
const addProductBtn = document.querySelector("#addProductBtn");
const adminMessage = document.querySelector("#adminMessage");

async function addKivraProduct() {

  if (!supabase) {
    alert("قاعدة البيانات غير متصلة.");
    return;
  }

  const name = document.querySelector("#adminName").value.trim();
  const price = Number(document.querySelector("#adminPrice").value);
  const phonesText = document.querySelector("#adminPhones").value.trim();
  const colorsText = document.querySelector("#adminColors").value.trim();
  const description = document.querySelector("#adminDescription").value.trim();
  const images = document.querySelector("#adminImages").files;

  if (!name || !price || !phonesText || !colorsText || !images.length) {
    adminMessage.textContent = "يرجى إدخال الاسم والسعر والموديلات والألوان والصور.";
    return;
  }

  adminMessage.textContent = "جاري إضافة الكفر...";

  const phones = phonesText.split(",").map(x => x.trim()).filter(Boolean);
  const colors = colorsText.split(",").map(x => x.trim()).filter(Boolean);

  let imageUrl = "";

  const file = images[0];

  const fileName =
    `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;

  const { error: uploadError } =
    await supabase.storage
      .from("kivra-images")
      .upload(fileName, file);

  if (uploadError) {
    console.error(uploadError);
    adminMessage.textContent = "حدث خطأ أثناء رفع الصورة.";
    return;
  }

  const { data: publicData } =
    supabase.storage
      .from("kivra-images")
      .getPublicUrl(fileName);

  imageUrl = publicData.publicUrl;

  const { error } =
    await supabase
      .from("products")
      .insert({
        name,
        price,
        phones,
        colors,
        description,
        image_url: imageUrl,
        collection: "iPhone",
        theme: "black",
        active: true
      });

  if (error) {
    console.error(error);
    adminMessage.textContent = "حدث خطأ أثناء إضافة الكفر.";
    return;
  }

  adminMessage.textContent = "تمت إضافة الكفر بنجاح ✅";

  document.querySelector("#adminName").value = "";
  document.querySelector("#adminPrice").value = "";
  document.querySelector("#adminPhones").value = "";
  document.querySelector("#adminColors").value = "";
  document.querySelector("#adminDescription").value = "";
  document.querySelector("#adminImages").value = "";
}

if (addProductBtn) {
  addProductBtn.addEventListener("click", addKivraProduct);
}


