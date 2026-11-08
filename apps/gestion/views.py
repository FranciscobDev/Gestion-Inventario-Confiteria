from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Q
from apps.usuarios.decorators import admin_required
from .models import Producto, Categoria
from .forms import ProductoForm


@admin_required
def home(request):
    """
    Vista principal del sistema de gestión de inventario.
    Protegida: solo accesible por administradores.
    """
    total_productos = Producto.objects.count()
    productos_alerta = [p for p in Producto.objects.all() if p.stock_actual <= p.stock_minimo]
    
    context = {
        'total_productos': total_productos,
        'productos_alerta_count': len(productos_alerta),
    }
    return render(request, 'gestion/home.html', context)


@admin_required
def productos_lista(request):
    """
    Lista todos los productos, con soporte para búsqueda y filtrado por categoría.
    """
    query = request.GET.get('q', '').strip()
    categoria_id = request.GET.get('categoria', '').strip()

    productos = Producto.objects.select_related('categoria', 'proveedor').all()

    if query:
        productos = productos.filter(
            Q(nombre__icontains=query) |
            Q(codigo_barras__icontains=query) |
            Q(descripcion__icontains=query)
        )

    if categoria_id:
        productos = productos.filter(categoria_id=categoria_id)

    categorias = Categoria.objects.all()

    context = {
        'productos': productos,
        'categorias': categorias,
        'query': query,
        'categoria_seleccionada': categoria_id,
        'total_registros': productos.count(),
    }
    return render(request, 'gestion/productos/lista.html', context)


@admin_required
def producto_crear(request):
    """
    Crea un nuevo producto.
    """
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES)
        if form.is_valid():
            producto = form.save()
            messages.success(request, f'Producto "{producto.nombre}" creado exitosamente.')
            return redirect('gestion:productos_lista')
        else:
            messages.error(request, 'Por favor corrige los errores indicados en el formulario.')
    else:
        form = ProductoForm()

    categorias_disponibles = Categoria.objects.exists()
    return render(request, 'gestion/productos/form.html', {
        'form': form,
        'titulo': 'Nuevo Producto',
        'subtitulo': 'Registra un nuevo producto en el inventario',
        'es_edicion': False,
        'hay_categorias': categorias_disponibles,
    })


@admin_required
def producto_editar(request, pk):
    """
    Actualiza la información de un producto existente.
    """
    producto = get_object_or_404(Producto, pk=pk)

    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES, instance=producto)
        if form.is_valid():
            form.save()
            messages.success(request, f'Producto "{producto.nombre}" actualizado correctamente.')
            return redirect('gestion:productos_lista')
        else:
            messages.error(request, 'Por favor corrige los errores indicados en el formulario.')
    else:
        form = ProductoForm(instance=producto)

    return render(request, 'gestion/productos/form.html', {
        'form': form,
        'producto': producto,
        'titulo': f'Editar Producto: {producto.nombre}',
        'subtitulo': 'Modifica los datos del producto seleccionado',
        'es_edicion': True,
        'hay_categorias': True,
    })


@admin_required
def producto_eliminar(request, pk):
    """
    Elimina un producto del inventario previa confirmación.
    """
    producto = get_object_or_404(Producto, pk=pk)

    if request.method == 'POST':
        nombre_prod = producto.nombre
        producto.delete()
        messages.success(request, f'El producto "{nombre_prod}" ha sido eliminado.')
        return redirect('gestion:productos_lista')

    return render(request, 'gestion/productos/eliminar_confirm.html', {
        'producto': producto
    })
