<?php
function adminUsers(): never
{
    $admin = requireUserAdministrator();
    $method = requireMethod('GET', 'POST', 'PATCH');
    $db = database();
    if ($method === 'GET') {
        $rows = sql($db, 'SELECT email, name, active, createdAt FROM InternalUser ORDER BY createdAt DESC')->fetchAll();
        $data = [['email' => $admin, 'name' => 'Admin', 'role' => 'admin', 'active' => true, 'createdAt' => null]];
        foreach ($rows as $row) if ($row['email'] !== $admin) $data[] = [...$row, 'active' => (bool)$row['active'], 'role' => 'manager'];
        respond(['data' => $data]);
    }
    requireOrigin();
    $body = input(4000);
    $email = $body['email'] ?? null;
    if (!is_string($email) || strlen($email) > 191 || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail(422, 'INVALID_REQUEST', 'Email không hợp lệ.');
    $email = strtolower(trim($email));
    if ($email === $admin) fail(409, 'CONFLICT', 'Không thể thay đổi tài khoản quản trị hệ thống.');
    if ($method === 'PATCH') {
        if (!is_bool($body['active'] ?? null)) fail(422, 'INVALID_REQUEST', 'Trạng thái không hợp lệ.');
        if (!internalUser($email)) fail(404, 'NOT_FOUND', 'Không tìm thấy người dùng.');
        sql($db, 'UPDATE InternalUser SET active = ?, sessionVersion = ? WHERE email = ?', [(int)$body['active'], bin2hex(random_bytes(32)), $email]);
    } else {
        $name = $body['name'] ?? null; $password = $body['password'] ?? null;
        if (!is_string($name) || trim($name) === '' || strlen($name) > 120 || !is_string($password) || strlen($password) < 10 || strlen($password) > 72) fail(422, 'INVALID_REQUEST', 'Tên tối đa 120 ký tự; mật khẩu từ 10 đến 72 byte.');
        try { sql($db, 'INSERT INTO InternalUser (email, name, passwordHash) VALUES (?, ?, ?)', [$email, trim($name), password_hash($password, PASSWORD_DEFAULT)]); }
        catch (PDOException $e) { if ((int)($e->errorInfo[1] ?? 0) === 1062) fail(409, 'CONFLICT', 'Email đã tồn tại.'); throw $e; }
    }
    respond(['ok' => true]);
}
