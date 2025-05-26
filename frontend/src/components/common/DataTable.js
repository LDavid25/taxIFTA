import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  alpha
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

// Función para ordenar datos
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// Componente para el encabezado de la tabla
function EnhancedTableHead(props) {
  const { 
    columns, 
    onSelectAllClick, 
    order, 
    orderBy, 
    numSelected, 
    rowCount, 
    onRequestSort,
    enableSelection
  } = props;
  
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {enableSelection && (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{ 'aria-label': 'seleccionar todos' }}
            />
          </TableCell>
        )}
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.numeric ? 'right' : 'left'}
            padding={column.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === column.id ? order : false}
            style={{ minWidth: column.minWidth }}
          >
            {column.sortable !== false ? (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
        <TableCell align="center">Acciones</TableCell>
      </TableRow>
    </TableHead>
  );
}

// Componente para la barra de herramientas de la tabla
function EnhancedTableToolbar(props) {
  const { 
    title, 
    numSelected, 
    onDelete, 
    searchText, 
    onSearchChange,
    filterComponent
  } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} seleccionado(s)
        </Typography>
      ) : (
        <Typography
          sx={{ flex: '1 1 100%' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          {title}
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Eliminar">
          <IconButton onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {searchText !== undefined && (
            <TextField
              variant="outlined"
              size="small"
              placeholder="Buscar..."
              value={searchText}
              onChange={onSearchChange}
              sx={{ mr: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          )}
          {filterComponent && (
            <Tooltip title="Filtrar">
              <IconButton>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Toolbar>
  );
}

// Componente principal de la tabla de datos
const DataTable = ({
  title,
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  enableSelection = false,
  searchText,
  onSearchChange,
  filterComponent,
  loading = false,
  emptyMessage = "No hay datos disponibles"
}) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('id');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Manejar solicitud de ordenamiento
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Manejar selección de todos los elementos
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = data.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  // Manejar clic en una fila para seleccionar
  const handleClick = (event, id) => {
    if (!enableSelection) return;
    
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Verificar si un elemento está seleccionado
  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Evitar una fila vacía en la tabla si la página no está llena
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  // Renderizar el valor de una celda según su tipo
  const renderCellValue = (column, value) => {
    if (column.render) {
      return column.render(value);
    }
    
    if (column.type === 'boolean') {
      return value ? 'Sí' : 'No';
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString();
    }
    
    if (column.type === 'datetime') {
      return new Date(value).toLocaleString();
    }
    
    if (column.type === 'currency') {
      return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(value);
    }
    
    if (column.type === 'number') {
      return new Intl.NumberFormat('es-ES').format(value);
    }
    
    if (column.type === 'status') {
      return (
        <Chip 
          label={value} 
          color={
            value === 'active' || value === 'approved' ? 'success' :
            value === 'pending' ? 'warning' :
            value === 'inactive' || value === 'rejected' ? 'error' :
            'default'
          }
          size="small"
        />
      );
    }
    
    return value;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar
          title={title}
          numSelected={selected.length}
          onDelete={() => onDelete && onDelete(selected)}
          searchText={searchText}
          onSearchChange={onSearchChange}
          filterComponent={filterComponent}
        />
        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size="medium"
          >
            <EnhancedTableHead
              columns={columns}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={data.length}
              enableSelection={enableSelection}
            />
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (enableSelection ? 2 : 1)} 
                    align="center"
                  >
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length + (enableSelection ? 2 : 1)} 
                    align="center"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                stableSort(data, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    const isItemSelected = isSelected(row.id);
                    const labelId = `enhanced-table-checkbox-${index}`;

                    return (
                      <TableRow
                        hover
                        onClick={(event) => handleClick(event, row.id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={row.id}
                        selected={isItemSelected}
                      >
                        {enableSelection && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isItemSelected}
                              inputProps={{ 'aria-labelledby': labelId }}
                            />
                          </TableCell>
                        )}
                        {columns.map((column) => (
                          <TableCell 
                            key={column.id} 
                            align={column.numeric ? 'right' : 'left'}
                          >
                            {renderCellValue(column, row[column.id])}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          {onView && (
                            <Tooltip title="Ver">
                              <IconButton 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onView(row.id);
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onEdit && (
                            <Tooltip title="Editar">
                              <IconButton 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(row.id);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onDelete && !enableSelection && (
                            <Tooltip title="Eliminar">
                              <IconButton 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete([row.id]);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={columns.length + (enableSelection ? 2 : 1)} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
    </Box>
  );
};

export default DataTable;
