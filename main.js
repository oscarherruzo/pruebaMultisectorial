/* =============================================================
   FERIA MULTISECTORIAL ANDÚJAR 2026
   Script principal — main.js
   Módulos:
     1. Menú móvil (hamburguesa)
     2. Pestañas del programa oficial (accesible con roles ARIA)
     3. Carrusel infinito de logos (duplicación del track)
     4. Botón volver arriba
     5. Animaciones de entrada (Intersection Observer)
     6. Validación y envío del formulario de contacto
     7. Activo de enlace de navegación al hacer scroll
   ============================================================= */

'use strict';


/* ─────────────────────────────────────────────────────────────
   UTILIDADES COMPARTIDAS
   ───────────────────────────────────────────────────────────── */

/**
 * Ejecuta un callback cuando el DOM está completamente cargado.
 * @param {Function} fn
 */
function alCargarDOM(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

/**
 * Selecciona un elemento del DOM o lanza un aviso si no existe.
 * @param {string} selector
 * @param {Element} [contexto=document]
 * @returns {Element|null}
 */
function qs(selector, contexto = document) {
  return contexto.querySelector(selector);
}

/**
 * Selecciona todos los elementos que coincidan con el selector.
 * @param {string} selector
 * @param {Element} [contexto=document]
 * @returns {NodeList}
 */
function qsa(selector, contexto = document) {
  return contexto.querySelectorAll(selector);
}


/* =============================================================
   1. MENÚ MÓVIL — HAMBURGUESA
   ============================================================= */

function inicializarMenuMovil() {
  const botonHamburguesa = qs('#boton-hamburguesa');
  const panelMenu        = qs('#menu-movil-panel');

  if (!botonHamburguesa || !panelMenu) return;

  /**
   * Abre o cierra el panel del menú móvil.
   */
  function alternarMenuMovil() {
    const estaAbierto = botonHamburguesa.getAttribute('aria-expanded') === 'true';

    botonHamburguesa.setAttribute('aria-expanded', String(!estaAbierto));
    botonHamburguesa.classList.toggle('abierto', !estaAbierto);
    panelMenu.setAttribute('aria-hidden', String(estaAbierto));

    // Muestra u oculta el panel con display block/none vía clase CSS
    if (!estaAbierto) {
      panelMenu.style.display = 'block';
      // Pequeño retraso para que la transición CSS de opacidad sea visible
      requestAnimationFrame(() => {
        requestAnimationFrame(() => panelMenu.classList.add('visible'));
      });
    } else {
      panelMenu.classList.remove('visible');
      // Espera a que acabe la transición antes de ocultar con display
      panelMenu.addEventListener('transitionend', function ocultarPanel() {
        panelMenu.style.display = '';
        panelMenu.removeEventListener('transitionend', ocultarPanel);
      });
    }
  }

  /**
   * Cierra el menú si se hace clic fuera del panel o del botón.
   * @param {MouseEvent} evento
   */
  function cerrarAlClickarFuera(evento) {
    if (
      botonHamburguesa.getAttribute('aria-expanded') === 'true' &&
      !panelMenu.contains(evento.target) &&
      !botonHamburguesa.contains(evento.target)
    ) {
      alternarMenuMovil();
    }
  }

  botonHamburguesa.addEventListener('click', alternarMenuMovil);
  document.addEventListener('click', cerrarAlClickarFuera);

  // Cierra el menú al pulsar un enlace del panel
  qsa('.enlace-menu-movil', panelMenu).forEach(enlace => {
    enlace.addEventListener('click', () => {
      if (botonHamburguesa.getAttribute('aria-expanded') === 'true') {
        alternarMenuMovil();
      }
    });
  });

  // Cierra el menú con la tecla Escape
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && botonHamburguesa.getAttribute('aria-expanded') === 'true') {
      alternarMenuMovil();
      botonHamburguesa.focus();
    }
  });
}


/* =============================================================
   2. PESTAÑAS DEL PROGRAMA OFICIAL
   ============================================================= */

function inicializarPestañasPrograma() {
  const selectorDias = qs('.selector-dias');
  if (!selectorDias) return;

  const botonesDia  = qsa('.boton-dia', selectorDias);
  const panelesDia  = qsa('.panel-dia');

  /**
   * Activa la pestaña correspondiente al índice dado.
   * @param {number} indiceActivo
   */
  function activarPestania(indiceActivo) {
    botonesDia.forEach((boton, i) => {
      const estaActivo = i === indiceActivo;
      boton.classList.toggle('activo', estaActivo);
      boton.setAttribute('aria-selected', String(estaActivo));
      boton.setAttribute('tabindex', estaActivo ? '0' : '-1');
    });

    panelesDia.forEach((panel, i) => {
      const estaActivo = i === indiceActivo;
      panel.classList.toggle('activo', estaActivo);
      if (estaActivo) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  // Inicializa el estado correcto de todos los botones (tabindex)
  botonesDia.forEach((boton, i) => {
    boton.setAttribute('tabindex', boton.classList.contains('activo') ? '0' : '-1');

    boton.addEventListener('click', () => activarPestania(i));

    // Navegación con teclado entre pestañas (flecha izquierda/derecha)
    boton.addEventListener('keydown', (evento) => {
      let nuevoIndice = i;

      if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
        evento.preventDefault();
        nuevoIndice = (i + 1) % botonesDia.length;
      } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
        evento.preventDefault();
        nuevoIndice = (i - 1 + botonesDia.length) % botonesDia.length;
      } else if (evento.key === 'Home') {
        evento.preventDefault();
        nuevoIndice = 0;
      } else if (evento.key === 'End') {
        evento.preventDefault();
        nuevoIndice = botonesDia.length - 1;
      }

      if (nuevoIndice !== i) {
        activarPestania(nuevoIndice);
        botonesDia[nuevoIndice].focus();
      }
    });
  });
}


/* =============================================================
   3. CARRUSEL INFINITO DE LOGOS
   ============================================================= */

function inicializarCarruselLogos() {
  const track = qs('#track-logos');
  if (!track) return;

  // Duplicamos el contenido del track para crear el bucle visual infinito.
  // La animación CSS desplaza el track -50%, lo que equivale a una copia completa.
  const itemsOriginales = track.innerHTML;
  track.innerHTML = itemsOriginales + itemsOriginales;

  // Si el usuario prefiere movimiento reducido, desactivamos la animación
  const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefiereMenosMovimiento) {
    track.style.animationPlayState = 'paused';
    // Reestablecemos el track al original para que se vea estático
    track.innerHTML = itemsOriginales;
  }
}


/* =============================================================
   4. BOTÓN VOLVER ARRIBA
   ============================================================= */

function inicializarBotonVolverArriba() {
  const boton = qs('#boton-volver-arriba');
  if (!boton) return;

  const UMBRAL_SCROLL_PX = 400; // Píxeles de scroll antes de mostrar el botón

  function actualizarVisibilidad() {
    if (window.scrollY > UMBRAL_SCROLL_PX) {
      boton.removeAttribute('hidden');
    } else {
      boton.setAttribute('hidden', '');
    }
  }

  // Escucha el scroll con throttle suave usando requestAnimationFrame
  let esperandoFrame = false;
  window.addEventListener('scroll', () => {
    if (!esperandoFrame) {
      esperandoFrame = true;
      requestAnimationFrame(() => {
        actualizarVisibilidad();
        esperandoFrame = false;
      });
    }
  }, { passive: true });

  boton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Estado inicial
  actualizarVisibilidad();
}


/* =============================================================
   5. ANIMACIONES DE ENTRADA (Intersection Observer)
   ============================================================= */

function inicializarAnimacionesEntrada() {
  // Si el usuario prefiere movimiento reducido, no aplicamos animaciones
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elementosAnimados = qsa('.animar-entrada, .animar-entrada--izquierda, .animar-entrada--derecha');

  if (!elementosAnimados.length) return;

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          // Una vez visible, dejamos de observar para no repetir la animación
          observador.unobserve(entrada.target);
        }
      });
    },
    {
      threshold: 0.12,     // 12% del elemento visible para disparar
      rootMargin: '0px 0px -40px 0px' // Margen inferior para entrar un poco antes
    }
  );

  elementosAnimados.forEach(el => observador.observe(el));
}


/* =============================================================
   6. VALIDACIÓN Y ENVÍO DEL FORMULARIO DE CONTACTO
   ============================================================= */

function inicializarFormularioContacto() {
  const formulario         = qs('#formulario-contacto');
  const botonEnviar        = qs('#boton-enviar');
  const mensajeExito       = qs('#mensaje-exito-formulario');

  if (!formulario) return;

  /* ── Reglas de validación por campo ── */
  const reglasValidacion = {
    'nombre-contacto': {
      requerido: true,
      longitudMinima: 3,
      mensajeVacio: 'Por favor, introduce tu nombre completo.',
      mensajeCortoDe: 'El nombre debe tener al menos 3 caracteres.'
    },
    'email-contacto': {
      requerido: true,
      patron: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      mensajeVacio: 'Por favor, introduce tu correo electrónico.',
      mensajeInvalido: 'El formato del correo no es válido (ej: nombre@empresa.com).'
    },
    'asunto-contacto': {
      requerido: true,
      mensajeVacio: 'Por favor, selecciona el motivo de tu consulta.'
    },
    'mensaje-contacto': {
      requerido: true,
      longitudMinima: 20,
      mensajeVacio: 'Por favor, escribe tu mensaje.',
      mensajeCortoDe: 'El mensaje debe tener al menos 20 caracteres.'
    },
    'privacidad': {
      requerido: true,
      tipo: 'checkbox',
      mensajeVacio: 'Debes aceptar la Política de Privacidad para continuar.'
    }
  };

  /**
   * Valida un campo concreto según las reglas definidas.
   * @param {HTMLElement} campo
   * @returns {boolean} true si el campo es válido
   */
  function validarCampo(campo) {
    const reglas = reglasValidacion[campo.id];
    if (!reglas) return true;

    const contenedorCampo = campo.closest('.campo-formulario');
    const spanError = contenedorCampo ? qs('.mensaje-error', contenedorCampo) : null;

    let mensajeError = '';

    // Validación de checkbox
    if (reglas.tipo === 'checkbox') {
      if (reglas.requerido && !campo.checked) {
        mensajeError = reglas.mensajeVacio;
      }
    } else {
      const valor = campo.value.trim();

      if (reglas.requerido && !valor) {
        mensajeError = reglas.mensajeVacio;
      } else if (valor && reglas.longitudMinima && valor.length < reglas.longitudMinima) {
        mensajeError = reglas.mensajeCortoDe;
      } else if (valor && reglas.patron && !reglas.patron.test(valor)) {
        mensajeError = reglas.mensajeInvalido;
      }
    }

    if (spanError) {
      spanError.textContent = mensajeError;
    }

    // Estado visual del campo
    campo.classList.toggle('entrada-formulario--error', !!mensajeError);
    campo.setAttribute('aria-invalid', mensajeError ? 'true' : 'false');

    return !mensajeError;
  }

  /**
   * Valida todos los campos del formulario.
   * @returns {boolean} true si el formulario completo es válido
   */
  function validarFormularioCompleto() {
    let formularioValido = true;

    Object.keys(reglasValidacion).forEach(idCampo => {
      const campo = qs(`#${idCampo}`, formulario);
      if (campo && !validarCampo(campo)) {
        formularioValido = false;
      }
    });

    return formularioValido;
  }

  // Validación en tiempo real al perder el foco (blur)
  Object.keys(reglasValidacion).forEach(idCampo => {
    const campo = qs(`#${idCampo}`, formulario);
    if (campo) {
      campo.addEventListener('blur', () => validarCampo(campo));

      // Para el checkbox, valida también al cambiar
      if (reglasValidacion[idCampo].tipo === 'checkbox') {
        campo.addEventListener('change', () => validarCampo(campo));
      } else {
        // Para los demás campos, limpia el error al escribir de nuevo (si ya se había validado)
        campo.addEventListener('input', () => {
          if (campo.getAttribute('aria-invalid') === 'true') {
            validarCampo(campo);
          }
        });
      }
    }
  });

  /* ── Envío del formulario ── */
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (!validarFormularioCompleto()) {
      // Foco en el primer campo con error
      const primerCampoConError = qs('[aria-invalid="true"]', formulario);
      if (primerCampoConError) primerCampoConError.focus();
      return;
    }

    // Estado de carga en el botón
    botonEnviar.disabled = true;
    botonEnviar.textContent = 'Enviando…';

    try {
      /*
       * EDITABLE: Aquí conectas tu backend o servicio de formularios.
       * Ejemplos:
       *   - fetch('https://api.tuservidor.com/contacto', { method: 'POST', body: new FormData(formulario) })
       *   - fetch('/api/contacto', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(datos) })
       *   - Formspree: fetch('https://formspree.io/f/TUCODIGO', { method: 'POST', body: new FormData(formulario) })
       *
       * Por defecto simulamos una espera de 1.5 s para demostración:
       */
      await new Promise(resolve => setTimeout(resolve, 1500));

      // — Si el envío es exitoso —
      formulario.reset();

      // Limpia todos los mensajes de error
      qsa('.mensaje-error', formulario).forEach(span => span.textContent = '');
      qsa('[aria-invalid]', formulario).forEach(campo => campo.removeAttribute('aria-invalid'));

      // Muestra el mensaje de confirmación
      if (mensajeExito) {
        mensajeExito.removeAttribute('hidden');
        mensajeExito.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Oculta el mensaje de éxito pasados 6 segundos
        setTimeout(() => {
          mensajeExito.setAttribute('hidden', '');
        }, 6000);
      }

    } catch (error) {
      // — Si hay un error en el envío —
      console.error('Error al enviar el formulario:', error);
      alert('Ha ocurrido un error al enviar tu mensaje. Por favor, inténtalo de nuevo o contacta directamente por teléfono.');
    } finally {
      // Restaura el botón en cualquier caso
      botonEnviar.disabled = false;
      botonEnviar.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        Enviar mensaje
      `;
    }
  });
}


/* =============================================================
   7. ENLACE ACTIVO EN NAVEGACIÓN AL HACER SCROLL
   ============================================================= */

function inicializarNavegacionActiva() {
  const seccionesObservadas = qsa('section[id], header[id]');
  const enlacesMenu         = qsa('.enlace-menu[href^="#"]');

  if (!seccionesObservadas.length || !enlacesMenu.length) return;

  /**
   * Marca como activo el enlace de navegación cuyo href coincida con el id dado.
   * @param {string} idActivo
   */
  function marcarEnlaceActivo(idActivo) {
    enlacesMenu.forEach(enlace => {
      const apuntaA = enlace.getAttribute('href').replace('#', '');
      enlace.classList.toggle('activo', apuntaA === idActivo);
    });
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          marcarEnlaceActivo(entrada.target.id);
        }
      });
    },
    {
      // El área de intersección ignora la altura del header sticky
      rootMargin: '-10% 0px -80% 0px'
    }
  );

  seccionesObservadas.forEach(seccion => observador.observe(seccion));
}


/* =============================================================
   INICIALIZACIÓN PRINCIPAL
   Todo se ejecuta cuando el DOM está listo.
   ============================================================= */

alCargarDOM(() => {

  inicializarMenuMovil();
  inicializarPestañasPrograma();
  inicializarCarruselLogos();
  inicializarBotonVolverArriba();
  inicializarAnimacionesEntrada();
  inicializarFormularioContacto();
  inicializarNavegacionActiva();

  // Pequeño log de depuración (puedes eliminarlo en producción)
  console.info('%c✅ Feria Multisectorial Andújar 2026 — Scripts cargados', 'color: #556b38; font-weight: bold;');

});
