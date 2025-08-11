import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";

interface XaInfo {
  tenXa: string;
  tenTinh: string;
  maXa_BNV?: string;
  maTinh_BNV: string;
  danSo?: number;
  dienTich?: number;
}

interface TinhInfo {
  tenTinh: string;
  maTinh_BNV: string;
  dienTich?: number;
  danSo?: number;
}

interface SidebarXaProps {
  selectedTinh: string | null;
}

export const SidebarXa = ({ selectedTinh }: SidebarXaProps) => {
  const [xaList, setXaList] = useState<XaInfo[]>([]);
  const [tinhInfo, setTinhInfo] = useState<TinhInfo | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  // lấy thông tin xã/phường
  useEffect(() => {
    if (!selectedTinh) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setLoading(true);

    fetch(`http://127.0.0.1:5000/api/infocommune/${encodeURIComponent(selectedTinh)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${res.status}`);
        return res.json();
      })
      .then((data: XaInfo[]) => {
        const sorted = data.sort((a: XaInfo, b: XaInfo) => {
          const nameA = a.tenXa;
          const nameB = b.tenXa;
          const isPhuongA = nameA.includes("Phường") ? 0 : 1;
          const isPhuongB = nameB.includes("Phường") ? 0 : 1;
          if (isPhuongA !== isPhuongB) return isPhuongA - isPhuongB;
          return nameA.localeCompare(nameB);
        });

        setXaList(sorted);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy dữ liệu xã/phường từ API:", error);
        setXaList([]);
        setLoading(false);
      });
  }, [selectedTinh]);

  // lấy thông tin tỉnh
  useEffect(() => {
    if (!selectedTinh) {
      setTinhInfo(null);
      return;
    }

    fetch(`http://127.0.0.1:5000/api/infoprovince/${encodeURIComponent(selectedTinh)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${res.status}`);
        return res.json();
      })
      .then((data: TinhInfo[]) => {
        if (data.length > 0) setTinhInfo(data[0]);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy thông tin tỉnh từ API:", error);
        setTinhInfo(null);
      });
  }, [selectedTinh]);

  if (!selectedTinh || !visible) return null;

  const filteredXaList = xaList.filter((xa) =>
    xa.tenXa.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="absolute top-2 right-2 bg-white p-4 shadow-md rounded w-[480px] max-h-[80vh] overflow-auto z-20">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-bold">
          {selectedTinh}
        </h2>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-500 hover:text-red-500"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {tinhInfo && (
        <div className="text-sm text-gray-700 mb-2">
          <div>Mã tỉnh: {tinhInfo.maTinh_BNV}</div>
          <div>Diện tích: {tinhInfo.dienTich?.toLocaleString() ?? "?"} km²</div>
          <div>Dân số: {tinhInfo.danSo?.toLocaleString() ?? "?"} người</div>
          <div>Tổng số phường/xã: {xaList.length.toLocaleString()}</div>
        </div>
      )}

      

      <Input
        placeholder="Tìm tên xã/phường..."
        className="mb-4"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      ) : filteredXaList.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã xã</TableHead>
              <TableHead>Phường/Xã</TableHead>
              <TableHead>Diện tích (km²)</TableHead>
              <TableHead>Dân số (người)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredXaList.map((xa, index) => (
              <TableRow key={xa.maXa_BNV || index}>
                <TableCell>{xa.maXa_BNV}</TableCell>
                <TableCell>{xa.tenXa}</TableCell>
                <TableCell>
                  {xa.dienTich?.toLocaleString() ?? "?"}
                </TableCell>
                <TableCell>
                  {xa.danSo?.toLocaleString() ?? "?"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-sm text-gray-500">Không có xã nào phù hợp.</div>
      )}
    </div>
  );
};
