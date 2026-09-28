<?php
declare(strict_types=1);

function database(bool $withDatabase = true): PDO
{
    $config = databaseConfig();
    $dsn = 'mysql:host=' . $config['host'] . ';port=' . $config['port'] . ';charset=utf8mb4';
    if ($withDatabase) $dsn .= ';dbname=' . $config['name'];
    return new PDO($dsn, $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function databaseConfig(): array
{
    $file = dirname(__DIR__) . '/config/database.php';
    return is_file($file) ? require $file : require dirname(__DIR__) . '/config/database.example.php';
}

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

final class Usuarios
{
    public function __construct(private PDO $db) {}

    public function listar(string $busqueda = ''): array
    {
        $stmt = $this->db->prepare('SELECT u.*, r.nombre AS rol FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.nombre LIKE ? OR u.apellido LIKE ? OR u.nickname LIKE ? OR u.email LIKE ? ORDER BY u.apellido, u.nombre, u.id');
        $stmt->execute(array_fill(0, 4, '%' . $busqueda . '%'));
        return $stmt->fetchAll();
    }

    public function buscar(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public function roles(): array
    {
        return $this->db->query('SELECT * FROM roles ORDER BY nombre')->fetchAll();
    }

    public function guardar(array $input, ?int $id = null): array
    {
        $data = [];
        $errors = [];
        foreach (['nombre', 'apellido', 'nickname', 'email', 'rol_id'] as $campo) {
            $data[$campo] = is_string($input[$campo] ?? null) ? trim($input[$campo]) : '';
        }
        foreach (['nombre', 'apellido'] as $campo) {
            if (mb_strlen($data[$campo]) < 1 || mb_strlen($data[$campo]) > 80) {
                $errors[$campo] = 'Ingresá entre 1 y 80 caracteres.';
            }
        }
        if (!preg_match('/\A[a-zA-Z0-9_.-]{3,40}\z/', $data['nickname'])) {
            $errors['nickname'] = 'Usá entre 3 y 40 letras, números, puntos, guiones o guiones bajos.';
        }
        if (strlen($data['email']) > 254 || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Ingresá un email válido (hasta 254 caracteres).';
        }
        if (!ctype_digit($data['rol_id']) || !in_array((int) $data['rol_id'], array_map('intval', array_column($this->roles(), 'id')), true)) {
            $errors['rol_id'] = 'Seleccioná un rol válido.';
        }
        if ($id !== null && !$this->buscar($id)) {
            throw new OutOfBoundsException('El usuario ya no existe.');
        }
        foreach (['nickname', 'email'] as $campo) {
            $stmt = $this->db->prepare("SELECT id FROM usuarios WHERE $campo = :valor AND id <> :id");
            $stmt->execute(['valor' => $data[$campo], 'id' => $id ?? 0]);
            if ($stmt->fetch()) $errors[$campo] = 'Este valor ya está registrado por otro usuario.';
        }
        if ($errors) return $errors;
        try {
            if ($id === null) {
                $stmt = $this->db->prepare('INSERT INTO usuarios (nombre, apellido, nickname, email, rol_id) VALUES (:nombre, :apellido, :nickname, :email, :rol_id)');
            } else {
                $data['id'] = $id;
                $stmt = $this->db->prepare('UPDATE usuarios SET nombre=:nombre, apellido=:apellido, nickname=:nickname, email=:email, rol_id=:rol_id WHERE id=:id');
            }
            $stmt->execute($data);
        } catch (PDOException $ex) {
            if ($ex->getCode() === '23000') return ['general' => 'No se pudo guardar: verificá que el email y el nickname no estén repetidos y que el rol exista.'];
            throw $ex;
        }
        return [];
    }

    public function eliminar(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() === 1;
    }
}
