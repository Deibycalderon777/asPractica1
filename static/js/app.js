function activeMenuOption(href) {
    $(".app-menu .nav-link")
    .removeClass("active")
    .removeAttr('aria-current')

    $(`[href="${(href ? href : "#/")}"]`)
    .addClass("active")
    .attr("aria-current", "page")
}

const app = angular.module("angularjsApp", ["ngRoute"])
app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("")

    $routeProvider
    .when("/", {
        templateUrl: "/",
        controller: "loginCtrl"
    })
    .when("/postres", {
        templateUrl: "/postres",
        controller: "postresCtrl"
    })
    .when("/ingredientes", {
        templateUrl: "/ingredientes",
        controller: "ingredientesCtrl"
    })
    .otherwise({
        redirectTo: "/"
    })
})

app.run(["$rootScope", "$location", "$timeout", function($rootScope, $location, $timeout) {
    function actualizarFechaHora() {
        lxFechaHora = DateTime
        .now()
        .setLocale("es")

        $rootScope.angularjsHora = lxFechaHora.toFormat("hh:mm:ss a")
        $timeout(actualizarFechaHora, 1000)
    }

    $rootScope.slide = ""

    actualizarFechaHora()
    app.controller("loginCtrl", function ($scope, $http, $location) {
    console.log("Controller loginCtrl cargado");
    
    // Variables del scope
    $scope.usuario = "";
    $scope.contrasena = "";
    $scope.mensaje = "";
    $scope.cargando = false;
    
    // Verificar si ya está logueado al cargar la página
    $scope.verificarSesion = function() {
        console.log("Verificando sesión...");
        
        $http.get("/verificar_sesion")
        .then(function(response) {
            console.log("Respuesta verificar sesión:", response.data);
            
            if (response.data.logged_in) {
                // Ya está logueado, redirigir a postres
                console.log("Usuario ya logueado, redirigiendo...");
                $location.path("/postres");
            }
        })
        .catch(function(error) {
            console.log("Error verificando sesión:", error);
        });
    };
    
    // Función de login
    $scope.login = function() {
        console.log("Ejecutando login...");
        console.log("Usuario:", $scope.usuario);
        console.log("Contraseña:", $scope.contrasena);
        
        // Validaciones básicas
        if (!$scope.usuario || !$scope.contrasena) {
            $scope.mensaje = "Por favor, completa todos los campos";
            return;
        }
        
        // Activar estado de carga
        $scope.cargando = true;
        $scope.mensaje = "";
        
        // Preparar datos para enviar
        var datos = {
            usuario: $scope.usuario,
            contrasena: $scope.contrasena
        };
        
        // Hacer petición POST al servidor
        $http({
            method: 'POST',
            url: '/login',
            data: $.param(datos),  // Convertir a formato form-data
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
        .then(function(response) {
            console.log("Login exitoso:", response.data);
            
            // Mostrar mensaje de éxito
            $scope.mensaje = response.data.message || "¡Bienvenido!";
            
            // Limpiar formulario
            $scope.usuario = "";
            $scope.contrasena = "";
            
            // Redirigir a la página de postres después de 1 segundo
            setTimeout(function() {
                $location.path("/postres");
                $scope.$apply(); // Necesario para que Angular detecte el cambio
            }, 1000);
        })
        .catch(function(error) {
            console.log("Error en login:", error);
            
            if (error.data && error.data.message) {
                $scope.mensaje = error.data.message;
            } else {
                $scope.mensaje = "Error al iniciar sesión. Intenta de nuevo.";
            }
        })
        .finally(function() {
            $scope.cargando = false;
        });
    };
    
    // Función de logout (para usar en otras partes de la app)
    $scope.logout = function() {
        console.log("Ejecutando logout...");
        
        $http.post("/logout")
        .then(function(response) {
            console.log("Logout exitoso:", response.data);
            $location.path("/");
        })
        .catch(function(error) {
            console.log("Error en logout:", error);
            // Aunque falle, redirigir al login
            $location.path("/");
        });
    };
    
    // Verificar sesión al cargar el controller
    $scope.verificarSesion();
});

// OPCIONAL: Agregar función global de logout para usar en el menú
// Agregar esto al final de tu app.js:

app.run(["$rootScope", "$location", "$timeout", "$http", function($rootScope, $location, $timeout, $http) {
    // Tu código existente de fecha/hora...
    function actualizarFechaHora() {
        lxFechaHora = DateTime
        .now()
        .setLocale("es")

        $rootScope.angularjsHora = lxFechaHora.toFormat("hh:mm:ss a")
        $timeout(actualizarFechaHora, 1000)
    }

    $rootScope.slide = ""
    actualizarFechaHora()

    // NUEVO: Función global de logout
    $rootScope.logout = function() {
        console.log("Logout global ejecutado");
        
        $http.post("/logout")
        .then(function(response) {
            console.log("Logout exitoso");
            $location.path("/");
        })
        .catch(function(error) {
            console.log("Error en logout:", error);
            $location.path("/");
        });
    };

    $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        $("html").css("overflow-x", "hidden")
        
        const path = current.$$route.originalPath

        if (path.indexOf("splash") == -1) {
            const active = $(".app-menu .nav-link.active").parent().index()
            const click  = $(`[href^="#${path}"]`).parent().index()

            if (active != click) {
                $rootScope.slide  = "animate__animated animate__faster animate__slideIn"
                $rootScope.slide += ((active > click) ? "Left" : "Right")
            }

            $timeout(function () {
                $("html").css("overflow-x", "auto")
                $rootScope.slide = ""
            }, 1000)

            activeMenuOption(`#${path}`)
        }
    })
}])

app.controller("loginCtrl", function ($scope, $http) {
    
})

// ======================================
// CONTROLLER DE POSTRES - CORREGIDO PARA DESARROLLO
// ======================================
app.controller("postresCtrl", function ($scope, $http) {
    function buscarPostres() {
        console.log("Ejecutando buscarPostres()");
        $.get("/tbodyPostres", function (trsHTML) {
            $("#tbodyPostres").html(trsHTML)
            console.log("Tabla de postres actualizada");
        })
    }

    function limpiarFormularioPostre() {
        console.log("Limpiando formulario de postre");
        $("#frmPostre")[0].reset()
        $("#hiddenIdPostre").remove()
    }

    buscarPostres() 
    
    // Mantener logging de Pusher para desarrollo/práctica
    Pusher.logToConsole = true;

    // Verificación para evitar Pusher duplicado
    if (typeof window.pusherPostres === 'undefined') {
        console.log("Inicializando Pusher para postres");
        window.pusherPostres = new Pusher('df675041e275bafce4a7', {
            cluster: 'mt1'
        });

        var channel = window.pusherPostres.subscribe("canalPostres");
        channel.bind("eventoPostres", function(data) {
            console.log("Evento Pusher recibido:", data);
            buscarPostres();
        });
    } else {
        console.log("Pusher para postres ya está inicializado");
    }

    // Guardar/actualizar postre
    $(document).off("submit", "#frmPostre").on("submit", "#frmPostre", function (event) {
        event.preventDefault()
        console.log("Formulario de postre enviado");

        // Deshabilitar botón durante el envío
        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true);
        console.log("Botón de envío deshabilitado");

        $.post("/postre", {
            idPostre: $("#hiddenIdPostre").val() || "",
            nombrePostre: $("#txtNombre").val(),
            precio: $("#txtPrecio").val()
        }, function(response) {
            console.log("Postre guardado exitosamente:", response)
            limpiarFormularioPostre()
            buscarPostres()
            toast("Postre guardado correctamente", 3, function() {
                console.log("Toast completado")
            })
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar postre:", error)
            console.error("Status:", status)
            console.error("Response:", xhr.responseText)
            alert("Error al guardar el postre")
        }).always(function() {
            console.log("Rehabilitando botón de envío");
            $submitBtn.prop('disabled', false);
        })
    })

    // Ver ingredientes de un postre
    $(document).off("click", ".btn-ingredientes").on("click", ".btn-ingredientes", function (event) {
        event.preventDefault();
        console.log("Botón ver ingredientes clickeado");
        
        const id = $(this).data("idpostre");
        console.log("ID del postre capturado:", id);
        console.log("Elemento clickeado:", this);
        console.log("Todos los data attributes:", $(this).data());
        
        if (id && id !== 'undefined' && id !== undefined) {
            console.log(`Haciendo petición a: /postres/ingredientes/${id}`);
            $.get(`/postres/ingredientes/${id}`, function (html) {
                console.log("Respuesta del servidor recibida:", html.substring(0, 100) + "...");
                modal(html, "Ingredientes del Postre", [
                    {html: "Cerrar", class: "btn btn-secondary", fun: function (event) {
                        console.log("Cerrando modal de ingredientes");
                        $(event.target).blur();
                        setTimeout(function() {
                            closeModal();
                        }, 10);
                    }}
                ])
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar ingredientes:", error);
                console.error("Status:", status);
                console.error("Response:", xhr.responseText);
                alert("Error al cargar ingredientes: " + error);
            });
        } else {
            console.error("ID no encontrado o es undefined");
            alert("Error: No se pudo obtener el ID del postre");
        }
    })

    // Editar postre
    $(document).off("click", ".btn-editar-postre").on("click", ".btn-editar-postre", function (event) {
        const id = $(this).data("id")
        console.log("Editando postre con ID:", id);
        
        $.get(`/postre/${id}`, function (data) {
            console.log("Datos del postre recibidos:", data);
            if (data.length > 0) {
                const postre = data[0]
                $("#txtNombre").val(postre.nombrePostre)
                $("#txtPrecio").val(postre.precio)
                
                if ($("#hiddenIdPostre").length === 0) {
                    $("#frmPostre").prepend('<input type="hidden" id="hiddenIdPostre" name="idPostre">')
                }
                $("#hiddenIdPostre").val(postre.idPostre)
                console.log("Formulario llenado para edición");
                
                $('html, body').animate({
                    scrollTop: $("#frmPostre").offset().top
                }, 500)
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar postre:", error)
            console.error("Status:", status)
            console.error("Response:", xhr.responseText)
            alert("Error al cargar los datos del postre")
        })
    })

    // Eliminar postre
    $(document).off("click", ".btn-eliminar-postre").on("click", ".btn-eliminar-postre", function (event) {
        const id = $(this).data("id")
        const $btn = $(this);
        console.log("Intentando eliminar postre con ID:", id);
        
        if (confirm("¿Está seguro de eliminar este postre?")) {
            $btn.prop('disabled', true);
            console.log("Botón de eliminar deshabilitado");
            
            $.post("/postre/eliminar", {
                id: id
            }, function(response) {
                console.log("Postre eliminado exitosamente:", response)
                buscarPostres()
                toast("Postre eliminado correctamente", 3)
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar postre:", error)
                console.error("Status:", status)
                console.error("Response:", xhr.responseText)
                alert("Error al eliminar el postre")
            }).always(function() {
                console.log("Rehabilitando botón de eliminar");
                $btn.prop('disabled', false);
            });
        }
    })

    // Cancelar edición
    $(document).off("click", "#btnCancelarPostre").on("click", "#btnCancelarPostre", function (event) {
        console.log("Cancelando edición de postre");
        limpiarFormularioPostre()
    })
})

// ======================================
// CONTROLLER DE INGREDIENTES - CORREGIDO PARA DESARROLLO
// ======================================
app.controller("ingredientesCtrl", function ($scope, $http) {
    function buscarIngredientes() {
        console.log("Ejecutando buscarIngredientes()");
        $.get("/tbodyIngredientes", function (trsHTML) {
            $("#tbodyIngredientes").html(trsHTML)
            console.log("Tabla de ingredientes actualizada");
        })
    }

    function limpiarFormularioIngrediente() {
        console.log("Limpiando formulario de ingrediente");
        $("#frmIngredientes")[0].reset()
        $("#hiddenIdIngrediente").remove()
    }

    buscarIngredientes()
    
    // Mantener logging de Pusher para desarrollo/práctica
    Pusher.logToConsole = true;

    // Verificación para evitar Pusher duplicado para ingredientes
    if (typeof window.pusherIngredientes === 'undefined') {
        console.log("Inicializando Pusher para ingredientes");
        window.pusherIngredientes = new Pusher("48294aad3f28c3669613", {
            cluster: "us2"
        });

        var channel = window.pusherIngredientes.subscribe("canalIngredientes");
        channel.bind("eventoDeIngredientes", function(data) {
            console.log("Evento Pusher ingredientes recibido:", data);
            buscarIngredientes();
        });
    } else {
        console.log("Pusher para ingredientes ya está inicializado");
    }

    // Guardar/actualizar ingrediente
    $(document).off("submit", "#frmIngredientes").on("submit", "#frmIngredientes", function (event) {
        event.preventDefault()
        console.log("Formulario de ingrediente enviado");

        // Deshabilitar botón durante el envío
        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true);
        console.log("Botón de envío deshabilitado");

        $.post("/ingrediente", {
            idIngrediente: $("#hiddenIdIngrediente").val() || "",
            nombreIngrediente: $("#txtNombre").val(),
            existencias: $("#txtExistencias").val()
        }, function(response) {
            console.log("Ingrediente guardado exitosamente:", response)
            limpiarFormularioIngrediente()
            buscarIngredientes()
            toast("Ingrediente guardado correctamente", 3, function() {
                console.log("Toast completado")
            })
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar ingrediente:", error)
            console.error("Status:", status)
            console.error("Response:", xhr.responseText)
            alert("Error al guardar el ingrediente")
        }).always(function() {
            console.log("Rehabilitando botón de envío");
            $submitBtn.prop('disabled', false);
        })
    })

    // Editar ingrediente
    $(document).off("click", ".btn-editar-ingrediente").on("click", ".btn-editar-ingrediente", function (event) {
        const id = $(this).data("id")
        console.log("Editando ingrediente con ID:", id);
        
        $.get(`/ingrediente/${id}`, function (data) {
            console.log("Datos del ingrediente recibidos:", data);
            if (data.length > 0) {
                const ingrediente = data[0]
                $("#txtNombre").val(ingrediente.nombreIngrediente)
                $("#txtExistencias").val(ingrediente.existencias)
                
                if ($("#hiddenIdIngrediente").length === 0) {
                    $("#frmIngredientes").prepend('<input type="hidden" id="hiddenIdIngrediente" name="idIngrediente">')
                }
                $("#hiddenIdIngrediente").val(ingrediente.idIngrediente)
                console.log("Formulario llenado para edición");
                
                $('html, body').animate({
                    scrollTop: $("#frmIngredientes").offset().top
                }, 500)
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar ingrediente:", error)
            console.error("Status:", status)
            console.error("Response:", xhr.responseText)
            alert("Error al cargar los datos del ingrediente")
        })
    })

    // Eliminar ingrediente
    $(document).off("click", ".btn-eliminar-ingrediente").on("click", ".btn-eliminar-ingrediente", function (event) {
        const id = $(this).data("id")
        const $btn = $(this);
        console.log("Intentando eliminar ingrediente con ID:", id);
        
        if (confirm("¿Está seguro de eliminar este ingrediente?")) {
            $btn.prop('disabled', true);
            console.log("Botón de eliminar deshabilitado");
            
            $.post("/ingrediente/eliminar", {
                id: id
            }, function(response) {
                console.log("Ingrediente eliminado exitosamente:", response)
                buscarIngredientes()
                toast("Ingrediente eliminado correctamente", 3)
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar ingrediente:", error)
                console.error("Status:", status)
                console.error("Response:", xhr.responseText)
                alert("Error al eliminar el ingrediente")
            }).always(function() {
                console.log("Rehabilitando botón de eliminar");
                $btn.prop('disabled', false);
            });
        }
    })

    // Cancelar edición
    $(document).off("click", "#btnCancelarIngrediente").on("click", "#btnCancelarIngrediente", function (event) {
        console.log("Cancelando edición de ingrediente");
        limpiarFormularioIngrediente()
    })
})

// ======================================
// CONFIGURACIÓN DE FECHA Y HORA
// ======================================
const DateTime = luxon.DateTime
let lxFechaHora

document.addEventListener("DOMContentLoaded", function (event) {
    console.log("DOM cargado completamente");
    
    const configFechaHora = {
        locale: "es",
        weekNumbers: true,
        // enableTime: true,
        minuteIncrement: 15,
        altInput: true,
        altFormat: "d/F/Y",
        dateFormat: "Y-m-d",
        // time_24hr: false
    }

    activeMenuOption(location.hash)
    console.log("Menú activo configurado para:", location.hash);
})

// ======================================
// FUNCIONES ADICIONALES PARA MODAL
// ======================================

// Función mejorada para cerrar modal sin errores de aria-hidden
function closeModalFixed() {
    console.log("Cerrando modal con función mejorada");
    // Quitar focus de cualquier elemento dentro del modal
    $('#modal-message').find(':focus').blur();
    
    // Pequeño delay para que el blur tome efecto
    setTimeout(function() {
        // Remover aria-hidden antes de cerrar
        $('#modal-message').removeAttr('aria-hidden');
        
        // Cerrar el modal
        $('#modal-message').modal('hide');
        
        // Devolver focus al body
        $('body').focus();
        console.log("Modal cerrado exitosamente");
    }, 10);
}

// Manejo de eventos de Bootstrap para evitar problemas de aria-hidden
$(document).ready(function() {
    console.log("Configurando eventos del modal");
    
    // Cuando el modal se está ocultando
    $(document).on('hide.bs.modal', '#modal-message', function (e) {
        console.log("Modal ocultándose");
        // Quitar focus de todos los elementos dentro del modal
        $(this).find(':focus').blur();
        
        // Remover aria-hidden temporalmente
        $(this).removeAttr('aria-hidden');
    });
    
    // Cuando el modal se ha ocultado completamente
    $(document).on('hidden.bs.modal', '#modal-message', function (e) {
        console.log("Modal completamente oculto");
        // Limpiar cualquier focus residual
        $('body').focus();
    });
});


