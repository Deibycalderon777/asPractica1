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
        templateUrl: "/app",
        controller: "appCtrl"
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

app.controller("appCtrl", function ($scope, $http) {
})

// ======================================
// CONTROLLER DE POSTRES CON BÚSQUEDA INTEGRADA
// ======================================
app.controller("postresCtrl", function ($scope, $http) {
    let timeoutPostres;
    
    // Función principal de búsqueda de postres
    function buscarPostres(termino = "") {
        console.log("Ejecutando buscarPostres() con término:", termino);
        
        if (termino.trim() === "") {
            // Cargar todos los postres
            $.get("/tbodyPostres", function (trsHTML) {
                $("#tbodyPostres").html(trsHTML);
                console.log("Tabla de postres actualizada sin filtro");
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar postres:", error);
                $("#tbodyPostres").html("<tr><td colspan='4' class='text-center text-danger'>Error al cargar postres</td></tr>");
            });
        } else {
            // Buscar con filtro
            $.get("/postres/buscar", {
                busqueda: termino
            }, function (postres) {
                console.log("Resultados de búsqueda postres:", postres);
                
                if (postres.length === 0) {
                    $("#tbodyPostres").html("<tr><td colspan='4' class='text-center text-muted'><i class='bi bi-search'></i> No se encontraron postres con ese criterio</td></tr>");
                } else {
                    // Construir HTML de la tabla
                    let html = "";
                    postres.forEach(function(postre) {
                        html += `
                            <tr>
                                <td>${postre.idPostre}</td>
                                <td>${postre.nombrePostre}</td>
                                <td>$${postre.precio}</td>
                                <td class="text-center">
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button class="btn btn-outline-info btn-ingredientes" 
                                                data-idpostre="${postre.idPostre}"
                                                title="Ver ingredientes">
                                            <i class="bi bi-list-ul"></i>
                                        </button>
                                        <button class="btn btn-outline-warning btn-editar-postre" 
                                                data-id="${postre.idPostre}"
                                                title="Editar">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-eliminar-postre" 
                                                data-id="${postre.idPostre}"
                                                title="Eliminar">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    });
                    $("#tbodyPostres").html(html);
                }
            }).fail(function(xhr, status, error) {
                console.error("Error en búsqueda de postres:", error);
                $("#tbodyPostres").html("<tr><td colspan='4' class='text-center text-danger'><i class='bi bi-exclamation-triangle'></i> Error en la búsqueda</td></tr>");
            });
        }
    }

    // Función con debounce para búsqueda
    function buscarPostresDebounced(termino) {
        clearTimeout(timeoutPostres);
        timeoutPostres = setTimeout(function() {
            buscarPostres(termino);
        }, 300);
    }

    function limpiarFormularioPostre() {
        console.log("Limpiando formulario de postre");
        $("#frmPostre")[0].reset();
        $("#hiddenIdPostre").remove();
    }

    // Cargar postres inicialmente
    buscarPostres();
    
    // Configuración de Pusher para postres
    Pusher.logToConsole = true;
    if (typeof window.pusherPostres === 'undefined') {
        console.log("Inicializando Pusher para postres");
        window.pusherPostres = new Pusher('df675041e275bafce4a7', {
            cluster: 'mt1'
        });

        var channel = window.pusherPostres.subscribe("canalPostres");
        channel.bind("eventoPostres", function(data) {
            console.log("Evento Pusher recibido:", data);
            // Mantener el término de búsqueda actual al actualizar
            const terminoBusqueda = $("#txtBuscarPostre").val() || "";
            buscarPostres(terminoBusqueda);
        });
    }

    // Event listener para búsqueda en tiempo real
    $(document).off("input", "#txtBuscarPostre").on("input", "#txtBuscarPostre", function() {
        const termino = $(this).val();
        console.log("Término de búsqueda de postre:", termino);
        buscarPostresDebounced(termino);
    });
    
    // Event listener para limpiar búsqueda
    $(document).off("click", "#btnLimpiarPostre").on("click", "#btnLimpiarPostre", function() {
        console.log("Limpiando búsqueda de postres");
        $("#txtBuscarPostre").val("");
        buscarPostres("");
    });

    // Guardar/actualizar postre
    $(document).off("submit", "#frmPostre").on("submit", "#frmPostre", function (event) {
        event.preventDefault();
        console.log("Formulario de postre enviado");

        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true);

        $.post("/postre", {
            idPostre: $("#hiddenIdPostre").val() || "",
            nombrePostre: $("#txtNombre").val(),
            precio: $("#txtPrecio").val()
        }, function(response) {
            console.log("Postre guardado exitosamente:", response);
            limpiarFormularioPostre();
            // Mantener búsqueda activa después de guardar
            const terminoBusqueda = $("#txtBuscarPostre").val() || "";
            buscarPostres(terminoBusqueda);
            toast("Postre guardado correctamente", 3);
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar postre:", error);
            alert("Error al guardar el postre");
        }).always(function() {
            $submitBtn.prop('disabled', false);
        });
    });

    // Ver ingredientes de un postre
    $(document).off("click", ".btn-ingredientes").on("click", ".btn-ingredientes", function (event) {
        event.preventDefault();
        console.log("Botón ver ingredientes clickeado");
        
        const id = $(this).data("idpostre");
        console.log("ID del postre capturado:", id);
        
        if (id && id !== 'undefined' && id !== undefined) {
            $.get(`/postres/ingredientes/${id}`, function (html) {
                console.log("Ingredientes cargados exitosamente");
                modal(html, "Ingredientes del Postre", [
                    {
                        html: '<i class="bi bi-x-circle"></i> Cerrar', 
                        class: "btn btn-secondary", 
                        fun: function (event) {
                            console.log("Cerrando modal de ingredientes");
                            $(event.target).blur();
                            setTimeout(closeModal, 10);
                        }
                    }
                ]);
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar ingredientes:", error);
                alert("Error al cargar ingredientes: " + error);
            });
        } else {
            console.error("ID no encontrado");
            alert("Error: No se pudo obtener el ID del postre");
        }
    });

    // Editar postre
    $(document).off("click", ".btn-editar-postre").on("click", ".btn-editar-postre", function (event) {
        const id = $(this).data("id");
        console.log("Editando postre con ID:", id);
        
        $.get(`/postre/${id}`, function (data) {
            console.log("Datos del postre recibidos:", data);
            if (data.length > 0) {
                const postre = data[0];
                $("#txtNombre").val(postre.nombrePostre);
                $("#txtPrecio").val(postre.precio);
                
                if ($("#hiddenIdPostre").length === 0) {
                    $("#frmPostre").prepend('<input type="hidden" id="hiddenIdPostre" name="idPostre">');
                }
                $("#hiddenIdPostre").val(postre.idPostre);
                console.log("Formulario llenado para edición");
                
                $('html, body').animate({
                    scrollTop: $("#frmPostre").offset().top
                }, 500);
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar postre:", error);
            alert("Error al cargar los datos del postre");
        });
    });

    // Eliminar postre
    $(document).off("click", ".btn-eliminar-postre").on("click", ".btn-eliminar-postre", function (event) {
        const id = $(this).data("id");
        const $btn = $(this);
        console.log("Intentando eliminar postre con ID:", id);
        
        if (confirm("¿Está seguro de eliminar este postre?")) {
            $btn.prop('disabled', true);
            
            $.post("/postre/eliminar", {
                id: id
            }, function(response) {
                console.log("Postre eliminado exitosamente:", response);
                // Mantener búsqueda activa después de eliminar
                const terminoBusqueda = $("#txtBuscarPostre").val() || "";
                buscarPostres(terminoBusqueda);
                toast("Postre eliminado correctamente", 3);
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar postre:", error);
                alert("Error al eliminar el postre");
            }).always(function() {
                $btn.prop('disabled', false);
            });
        }
    });

    // Cancelar edición
    $(document).off("click", "#btnCancelarPostre").on("click", "#btnCancelarPostre", function (event) {
        console.log("Cancelando edición de postre");
        limpiarFormularioPostre();
    });
});


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

