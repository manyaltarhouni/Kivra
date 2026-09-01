/* =========================================================
   KIVRA STORE
   DATABASE VERSION
   ========================================================= */

/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL =
  "https://dwqsyyikqyedbvscearv.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_uQk-bxeERNR9X-QLoVPqSQ_rdBIp5Cv";

/* =========================================================
   SUPABASE CLIENT
   ========================================================= */

const supabaseScript = document.createElement("script");

supabaseScript.src =
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

supabaseScript.onload = initStore;

document.head.appendChild(supabaseScript);

/* =========================================================
   STORE
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
   ELEMENT HELPER
   ========================================================= */

const $ = selector =>
  document.querySelector(selector);

/* =========================================================
   INIT
   ========================================================= */

async function initStore() {

  if (!window.supabase) {
    showDatabaseError("تعذر تشغيل قاعدة البيانات.");
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

  const grid = $("#productsGrid");

  if (!grid) return;

  grid.innerHTML = `
    <div
      class="empty"
      style="grid-column:1/-1"
    >
      ${escapeHTML(message)}
    </div>
  `;
}

/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

  if (!supabase) return;

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

  if (!supabase) return;

  supabase
    .channel("kivra-products")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products"
      },
      () => {
        loadProducts();
      }
    )
    .subscribe();
}

/* =========================================================
   COLORS
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

  const grid = $("#productsGrid");

  if (!grid) return;

  const phoneElement = $("#phoneFilter");
  const searchElement = $("#productSearch");

  const phone =
    phoneElement
      ? phoneElement.value
      : "all";

  const search =
    searchElement
      ? searchElement.value
        .trim()
        .toLowerCase()
      : "";

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
        !search ||
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
          product.image_url || "";

        return `
          <article
            class="product-card"
            data-product-id="${escapeHTML(product.id)}"
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

  grid
    .querySelectorAll(".product-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          openProduct(
            card.dataset.productId
          );

        }
      );

    });
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

  if (!selectedProduct) return;

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

  const modal = $("#productModal");
  const overlay = $("#overlay");

  if (modal) {
    modal.classList.add("open");
  }

  if (overlay) {
    overlay.classList.add("open");
  }

  document.body.classList.add(
    "modal-open"
  );
}

/* =========================================================
   PRODUCT MODAL
   ========================================================= */

function renderModal() {

  if (!selectedProduct) return;

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
    product.image_url || "";

  const modalContent =
    $("#modalContent");

  if (!modalContent) return;

  modalContent.innerHTML = `

    <div class="modal-product">

      <div
        class="modal-art art-${escapeHTML(
          product.theme || "black"
        )}"
      >

        ${
          image
            ? `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name)}"
              >
            `
            : `
              <div class="mock-case">
                ${escapeHTML(
                  String(product.name || "K")
                    .charAt(0)
                )}
              </div>
            `
        }

      </div>

      <div class="modal-details">

        <span class="mini-title">
          ${escapeHTML(
            product.collection || ""
          )}
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
                    data-phone="${escapeHTML(phone)}"
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
                    data-color="${escapeHTML(color)}"
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
          id="modalAddToCart"
        >
          أضف إلى السلة
          <span>←</span>
        </button>

      </div>

    </div>

  `;

  modalContent
    .querySelectorAll("[data-phone]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedPhone =
            button.dataset.phone;

          renderModal();

        }
      );

    });

  modalContent
    .querySelectorAll("[data-color]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedColor =
            button.dataset.color;

          renderModal();

        }
      );

    });

  const addButton =
    $("#modalAddToCart");

  if (addButton) {

    addButton.addEventListener(
      "click",
      addToCart
    );

  }
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

      image:
        selectedProduct.image_url || "",

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
        total + Number(item.quantity || 1),
      0
    );

  const element =
    $("#cartCount");

  if (element) {
    element.textContent = count;
  }
}

/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {

  const cartItems =
    $("#cartItems");

  if (!cartItems) return;

  if (!cart.length) {

    cartItems.innerHTML = `
      <div class="empty">
        السلة فارغة
      </div>
    `;

    const totalElement =
      $("#cartTotal");

    if (totalElement) {
      totalElement.textContent =
        "0 د.ل";
    }

    return;
  }

  cartItems.innerHTML =
    cart.map(
      (item, index) => {

        const quantity =
          Number(item.quantity || 1);

        const itemImage =
          item.image || "";

        return `
          <div class="cart-row">

            <div
              class="cart-thumb"
              ${
                itemImage
                  ? `style="
                      background-image:url('${escapeHTML(itemImage)}');
                      background-size:cover;
                      background-position:center;
                    "`
                  : ""
              }
            ></div>

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
                  data-action="decrease"
                  data-index="${index}"
                >
                  −
                </button>

                <span>
                  ${quantity}
                </span>

                <button
                  class="option"
                  data-action="increase"
                  data-index="${index}"
                >
                  +
                </button>

              </div>

            </div>

            <button
              class="icon-btn cart-delete"
              data-action="remove"
              data-index="${index}"
              aria-label="حذف"
            >
              ×
            </button>

          </div>
        `;
      }
    ).join("");

  cartItems
    .querySelectorAll("[data-action]")
    .forEach(button => {

      const index =
        Number(button.dataset.index);

      const action =
        button.dataset.action;

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();

          if (action === "increase") {
            increaseQuantity(index);
          }

          if (action === "decrease") {
            decreaseQuantity(index);
          }

          if (action === "remove") {
            removeCart(index);
          }

        }
      );

    });

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 1),
      0
    );

  const totalElement =
    $("#cartTotal");

  if (totalElement) {
    totalElement.textContent =
      `${total} د.ل`;
  }
}

/* =========================================================
   QUANTITY
   ========================================================= */

function increaseQuantity(index) {

  if (!cart[index]) return;

  cart[index].quantity =
    Number(cart[index].quantity || 1) + 1;

  saveCart();
}

function decreaseQuantity(index) {

  if (!cart[index]) return;

  const quantity =
    Number(cart[index].quantity || 1);

  if (quantity > 1) {

    cart[index].quantity =
      quantity - 1;

  } else {

    cart.splice(index, 1);

  }

  saveCart();
}

function removeCart(index) {

  if (!cart[index]) return;

  cart.splice(index, 1);

  saveCart();
}

/* =========================================================
   OPEN CART
   ========================================================= */

function openCart() {

  const drawer =
    $("#cartDrawer");

  const overlay =
    $("#overlay");

  if (drawer) {
    drawer.classList.add("open");
  }

  if (overlay) {
    overlay.classList.add("open");
  }

  document.body.classList.add(
    "modal-open"
  );

  renderCart();
}

/* =========================================================
   CLOSE EVERYTHING
   ========================================================= */

function closeAll() {

  [
    "#cartDrawer",
    "#productModal",
    "#checkoutModal",
    "#overlay"
  ].forEach(selector => {

    const element = $(selector);

    if (element) {
      element.classList.remove("open");
    }

  });

  document.body.classList.remove(
    "modal-open"
  );
}

/* =========================================================
   CLOSE PRODUCT
   ========================================================= */

function closeModal() {

  const modal =
    $("#productModal");

  const overlay =
    $("#overlay");

  if (modal) {
    modal.classList.remove("open");
  }

  if (overlay) {
    overlay.classList.remove("open");
  }

  document.body.classList.remove(
    "modal-open"
  );
}

/* =========================================================
   SEARCH
   ========================================================= */

const searchBtn =
  $("#searchBtn");

if (searchBtn) {

  searchBtn.addEventListener(
    "click",
    () => {

      const productsSection =
        $("#products");

      if (productsSection) {

        productsSection.scrollIntoView({
          behavior: "smooth"
        });

      }

      setTimeout(() => {

        const search =
          $("#productSearch");

        if (search) {
          search.focus();
        }

      }, 500);

    }
  );

}

/* =========================================================
   FILTER
   ========================================================= */

const phoneFilter =
  $("#phoneFilter");

if (phoneFilter) {

  phoneFilter.addEventListener(
    "change",
    renderProducts
  );

}

const productSearch =
  $("#productSearch");

if (productSearch) {

  productSearch.addEventListener(
    "input",
    renderProducts
  );

}

/* =========================================================
   CART BUTTON
   ========================================================= */

const cartBtn =
  $("#cartBtn");

if (cartBtn) {

  cartBtn.addEventListener(
    "click",
    openCart
  );

}

/* =========================================================
   CLOSE CART
   ========================================================= */

const closeCart =
  $("#closeCart");

if (closeCart) {

  closeCart.addEventListener(
    "click",
    closeAll
  );

}

/* =========================================================
   CLOSE PRODUCT
   ========================================================= */

const closeProduct =
  $("#closeModal");

if (closeProduct) {

  closeProduct.addEventListener(
    "click",
    closeModal
  );

}

/* =========================================================
   OVERLAY
   ========================================================= */

const overlay =
  $("#overlay");

if (overlay) {

  overlay.addEventListener(
    "click",
    closeAll
  );

}

/* =========================================================
   MOBILE MENU
   ========================================================= */

const menuBtn =
  $("#menuBtn");

if (menuBtn) {

  menuBtn.addEventListener(
    "click",
    () => {

      menuBtn.classList.toggle(
        "active"
      );

      const nav =
        $("#mainNav");

      if (nav) {

        nav.classList.toggle(
          "mobile-open"
        );

      }

    }
  );

}

/* =========================================================
   MOBILE MENU LINKS
   ========================================================= */

document
  .querySelectorAll(".nav a")
  .forEach(link => {

    link.addEventListener(
      "click",
      () => {

        const nav =
          $("#mainNav");

        if (nav) {

          nav.classList.remove(
            "mobile-open"
          );

        }

      }
    );

  });

/* =========================================================
   CHECKOUT
   ========================================================= */

const checkoutBtn =
  $("#checkoutBtn");

if (checkoutBtn) {

  checkoutBtn.addEventListener(
    "click",
    openCheckout
  );

}

function openCheckout() {

  if (!cart.length) {

    alert("السلة فارغة.");

    return;
  }

  renderCheckoutSummary();

  const modal =
    $("#checkoutModal");

  const overlay =
    $("#overlay");

  if (modal) {
    modal.classList.add("open");
  }

  if (overlay) {
    overlay.classList.add("open");
  }

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

  if (!summary) return;

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 1),
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
          × ${Number(item.quantity || 1)}
        </span>

        <strong>
          ${
            Number(item.price || 0) *
            Number(item.quantity || 1)
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

const closeCheckout =
  $("#closeCheckout");

if (closeCheckout) {

  closeCheckout.addEventListener(
    "click",
    closeAll
  );

}

/* =========================================================
   SUBMIT ORDER
   ========================================================= */

const checkoutForm =
  $("#checkoutForm");

if (checkoutForm) {

  checkoutForm.addEventListener(
    "submit",
    function(event) {

      event.preventDefault();

      if (!cart.length) {

        alert("السلة فارغة.");

        return;
      }

      const name =
        $("#customerName")?.value.trim();

      const phone =
        $("#customerPhone")?.value.trim();

      const address =
        $("#customerAddress")?.value.trim();

      const notes =
        $("#customerNotes")?.value.trim();

      if (!name || !phone || !address) {

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
            Number(item.quantity || 1),
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
  Number(item.quantity || 1)
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

      checkoutForm.reset();

      closeAll();

      showToast(
        "تم تجهيز الطلب وفتح WhatsApp"
      );

    }
  );

}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  const toast =
    $("#successToast");

  if (!toast) return;

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

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
   SECURITY
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
   KIVRA ADMIN
   ========================================================= */

const adminPanel =
  $("#adminPanel");

const addProductBtn =
  $("#addProductBtn");

const adminMessage =
  $("#adminMessage");

/* =========================================================
   ADD PRODUCT
   ========================================================= */

async function addKivraProduct() {

  if (!supabase) {

    if (adminMessage) {

      adminMessage.textContent =
        "قاعدة البيانات غير متصلة.";

    }

    return;
  }

  const name =
    $("#adminName")?.value.trim();

  const price =
    Number($("#adminPrice")?.value);

  const phonesText =
    $("#adminPhones")?.value.trim();

  const colorsText =
    $("#adminColors")?.value.trim();

  const description =
    $("#adminDescription")?.value.trim();

  const imageInput =
    $("#adminImages");

  const images =
    imageInput?.files || [];

  if (
    !name ||
    !price ||
    !phonesText ||
    !colorsText ||
    !images.length
  ) {

    if (adminMessage) {

      adminMessage.textContent =
        "يرجى إدخال الاسم والسعر والموديلات والألوان والصور.";

    }

    return;
  }

  if (adminMessage) {

    adminMessage.textContent =
      "جاري إضافة الكفر...";

  }

  try {

    const phones =
      phonesText
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const colors =
      colorsText
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    const imageUrls = [];

    /* =====================================================
       UPLOAD ALL IMAGES
       ===================================================== */

    for (
      let i = 0;
      i < images.length;
      i++
    ) {

      const file =
        images[i];

      const safeName =
        file.name
          .replace(
            /[^a-zA-Z0-9._-]/g,
            ""
          );

      const fileName =
        `${Date.now()}-${i}-${Math.random()
          .toString(36)
          .substring(2, 8)}-${safeName}`;

      const {
        error: uploadError
      } =
        await supabase.storage
          .from("kivra-images")
          .upload(
            fileName,
            file
          );

      if (uploadError) {

        console.error(
          "Upload error:",
          uploadError
        );

        throw new Error(
          "UPLOAD_ERROR"
        );
      }

      const {
        data: publicData
      } =
        supabase.storage
          .from("kivra-images")
          .getPublicUrl(
            fileName
          );

      if (
        publicData &&
        publicData.publicUrl
      ) {

        imageUrls.push(
          publicData.publicUrl
        );

      }

    }

    /* =====================================================
       INSERT PRODUCT
       ===================================================== */

    const {
      error: insertError
    } =
      await supabase
        .from("products")
        .insert({

          name: name,

          price: price,

          phones: phones,

          colors: colors,

          description:
            description || "",

          image_url:
            imageUrls[0] || "",

          collection:
            "iPhone",

          theme:
            "black",

          active:
            true

        });

    if (insertError) {

      console.error(
        "Insert error:",
        insertError
      );

      throw new Error(
        "INSERT_ERROR"
      );
    }

    /* =====================================================
       SUCCESS
       ===================================================== */

    if (adminMessage) {

      adminMessage.textContent =
        "تمت إضافة الكفر بنجاح ✅";

    }

    const fields = [
      "#adminName",
      "#adminPrice",
      "#adminPhones",
      "#adminColors",
      "#adminDescription"
    ];

    fields.forEach(selector => {

      const field = $(selector);

      if (field) {
        field.value = "";
      }

    });

    if (imageInput) {
      imageInput.value = "";
    }

    /*
      تحديث الموقع فورًا
      بدون إعادة تشغيل الصفحة
    */

    await loadProducts();

  } catch (error) {

    console.error(
      "KIVRA ADMIN ERROR:",
      error
    );

    if (adminMessage) {

      if (
        error.message ===
        "UPLOAD_ERROR"
      ) {

        adminMessage.textContent =
          "حدث خطأ أثناء رفع الصورة.";

      } else {

        adminMessage.textContent =
          "حدث خطأ أثناء إضافة الكفر.";

      }

    }

  }

}

/* =========================================================
   ADMIN BUTTON
   ========================================================= */

if (addProductBtn) {

  addProductBtn.addEventListener(
    "click",
    addKivraProduct
  );

}
