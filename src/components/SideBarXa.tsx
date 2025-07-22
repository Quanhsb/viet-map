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

interface XaFeature {
  properties: {
    tenXa: string;
    tenTinh: string;
    maXa: string;
    danSo?: number;
    dienTich?: number;
  };
}

interface SidebarXaProps {
  selectedTinh: string | null;
}

export const SidebarXa = ({ selectedTinh }: SidebarXaProps) => {
  const [xaList, setXaList] = useState<XaFeature[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!selectedTinh) return;

    fetch("/data/DiaPhan_Xa_2025.json")
      .then((res) => res.json())
      .then((geojson) => {
        const filtered = geojson.features
          .filter((f: any) => f.properties.tenTinh === selectedTinh)
          .sort((a: XaFeature, b: XaFeature) => {
            const nameA = a.properties.tenXa;
            const nameB = b.properties.tenXa;

            const isPhuongA = nameA.includes("Phường") ? 0 : 1;
            const isPhuongB = nameB.includes("Phường") ? 0 : 1;

            // Ưu tiên Phường trước, sau đó sort theo tên
            if (isPhuongA !== isPhuongB) return isPhuongA - isPhuongB;
            return nameA.localeCompare(nameB);
          });

        setXaList(filtered);
      });
  }, [selectedTinh]);

  if (!selectedTinh) return null;

  const filteredXaList = xaList.filter((xa) =>
    xa.properties.tenXa.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="absolute top-2 right-2 bg-white p-4 shadow-md rounded w-[480px] max-h-[80vh] overflow-auto z-20">
      <h2 className="text-lg font-bold mb-4">Xã thuộc tỉnh: {selectedTinh}</h2>

      <Input
        placeholder="Tìm tên xã/phường..."
        className="mb-4"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      {filteredXaList.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã xã</TableHead>
              <TableHead>Phường/Xã</TableHead>
              <TableHead>Diện tích (km²)</TableHead>
              <TableHead>Dân số</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredXaList.map((xa, index) => (
              <TableRow key={index}>
                <TableCell>{xa.properties.maXa}</TableCell>
                <TableCell>{xa.properties.tenXa}</TableCell>
                <TableCell>
                  {xa.properties.dienTich?.toLocaleString() ?? "?"}
                </TableCell>
                <TableCell>
                  {xa.properties.danSo?.toLocaleString() ?? "?"}
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
